document.addEventListener("DOMContentLoaded", () => {
    const yearInput = document.getElementById("year-input");
    yearInput.value = 2024; // Set default year to 2024
    const yearForm = document.getElementById("year-form");
    const mapIframe = document.querySelector("#map-container iframe");

    const yearIndicator = document.getElementById("year-indicator");

    const updateMapYear = (year) => {
        // Extract current map position and zoom level from iframe
        const hashParams = mapIframe.src.split("#")[1].split("&");
        let mapZoom = "0"; // Default zoom level
        let mapLat = "43.021"; // Default latitude
        let mapLon = "7.471"; // Default longitude

        hashParams.forEach(param => {
            if (param.startsWith("map=")) {
                const mapValues = param.split("=")[1].split("/");
                mapZoom = mapValues[0];
                mapLat = mapValues[1];
                mapLon = mapValues[2];
            }
        });

        // Save the current map state
        const currentMapState = `map=${mapZoom}/${mapLat}/${mapLon}`;

        // Update the iframe src with the saved state and new date
        mapIframe.src = `https://embed.openhistoricalmap.org/#${currentMapState}&layers=O&date=${year}-12-08`;

        // Update the year indicator
        yearIndicator.textContent = `Year: ${year}`;
    };

    const adjustYear = (delta) => {
        const currentYear = parseInt(yearInput.value, 10);
        const newYear = currentYear + delta;
        yearInput.value = newYear;
        updateMapYear(newYear);
    };

    // Slider functionality
    const slider = document.getElementById("slider");
    const mapContainer = document.getElementById("map-container");
    const sidebar = document.querySelector(".sidebar");

    let isDragging = false;

    slider.addEventListener("mousedown", (e) => {
        isDragging = true;
        document.body.style.cursor = "col-resize";
    });

    // Add hover functionality for country names
    let hoverTimeout;

    const handleHover = async (target) => {
        if (target.dataset.country) {
            const countryName = target.dataset.country;

            try {
                // Fetch coordinates from OpenStreetMap
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${countryName}`);
                if (!response.ok) throw new Error("Failed to fetch coordinates");

                const data = await response.json();
                if (data.length > 0) {
                    const { lat, lon, type } = data[0];

                    // Determine zoom level based on addresstype
                    const zoomLevels = {
                        continent: 3,
                        country: 5,
                        state: 7,
                        region: 7,
                        county: 9,
                        city: 11,
                        town: 13,
                        village: 15
                    };
                    const mapZoom = zoomLevels[type] || 6; // Default zoom level if type is not recognized

                    // Update the map iframe with the new coordinates and zoom level
                    mapIframe.src = `https://embed.openhistoricalmap.org/#map=${mapZoom}/${lat}/${lon}&layers=O`;
                }
            } catch (error) {
                console.error("Error fetching coordinates:", error);
            }
        } else {
            // If the hovered element is a number, update the year
            const year = parseInt(target.textContent, 10);
            if (!isNaN(year)) {
                yearInput.value = year;
                updateMapYear(year);
            }
        }
    };

    const hoverHandler = (event) => {
        const target = event.target;

        // Check if the hovered element is a country name or a number
        if (target.tagName === "SPAN" && (target.dataset.country || !isNaN(target.textContent))) {
            hoverTimeout = setTimeout(() => handleHover(target), 1000); // Trigger after 1 second
        }
    };

    const hoverEndHandler = () => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
    };

    document.addEventListener("mouseover", hoverHandler);
    document.addEventListener("mouseout", hoverEndHandler);

    // Add support for touchstart on mobile devices
    document.addEventListener("touchstart", (event) => {
        const target = event.target;

        if (target.tagName === "SPAN" && (target.dataset.country || !isNaN(target.textContent))) {
            handleHover(target);
        }
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        const containerRect = document.querySelector(".resizable-container").getBoundingClientRect();
        const offsetX = e.clientX - containerRect.left;

        const mapWidthPercentage = (offsetX / containerRect.width) * 100;
        const sidebarWidthPercentage = 100 - mapWidthPercentage;

        mapContainer.style.flex = `${mapWidthPercentage}`;
        sidebar.style.flex = `${sidebarWidthPercentage}`;
    });

    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.cursor = "default";
        }
    });

    document.getElementById("year-minus-100").addEventListener("click", () => adjustYear(-100));
    document.getElementById("year-minus-10").addEventListener("click", () => adjustYear(-10));
    document.getElementById("year-plus-10").addEventListener("click", () => adjustYear(10));
    document.getElementById("year-plus-100").addEventListener("click", () => adjustYear(100));

    yearForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const newYear = parseInt(yearInput.value, 10);
        updateMapYear(newYear);
    });

    // Handle Wikipedia form submission
    const form = document.getElementById("wiki-form");
    const searchForm = document.getElementById("wiki-search-form");
    const searchResults = document.getElementById("wiki-search-results");
    const wikiContent = document.getElementById("wiki-content");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const wikiLink = document.getElementById("wiki-link").value.trim();

        if (wikiLink.includes("wikipedia.org")) {
            // Handle Wikipedia link
            const urlParts = new URL(wikiLink);
            const langCode = urlParts.hostname.split(".")[0]; // Extract language code from the hostname
            const pageTitle = urlParts.pathname.split("/").pop();

            try {
                // Fetch the Wikipedia article content using the language-specific API link format
                const response = await fetch(`https://${langCode}.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&titles=${pageTitle}&origin=*`);
                if (!response.ok) throw new Error("Failed to fetch Wikipedia article");

                const data = await response.json();
                const page = Object.values(data.query.pages)[0]; // Extract the first page object
                // Sanitize the extract to remove unwanted attributes
                const sanitizedExtract = page.extract
                    .replace(/<([^>]+) data-mw-fallback-anchor="[^"]+"([^>]*)>/g, '<$1$2>') // Remove data-mw-fallback-anchor
                    .replace(/\b([A-Z][a-z]+)\b/g, '<span data-country="$1">$1</span>') // Highlight country names
                    .replace(/\b(\d{1,4})\b/g, '<span data-year="$1">$1</span>'); // Highlight years

                wikiContent.innerHTML = `
                    <h2>${page.title}</h2>
                    <p>${sanitizedExtract}</p>
                `;
            } catch (error) {
                wikiContent.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }
        } else if (wikiLink.includes("docs.google.com/document")) {
            // Handle Google Doc link
            const docIdMatch = wikiLink.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (!docIdMatch) {
                wikiContent.innerHTML = `<p style="color: red;">Error: Invalid Google Doc link.</p>`;
                return;
            }

            const docId = docIdMatch[1];
            try {
                // Fetch the Google Doc content using the export API
                const response = await fetch(`https://docs.google.com/document/d/${docId}/export?format=txt`);
                if (!response.ok) throw new Error("Failed to fetch Google Doc content");

                const docText = await response.text();
                // Sanitize and process the text to apply hover functionality
                const sanitizedText = docText
                    .split("\n") // Split text into lines
                    .map(line => line.trim()) // Trim each line
                    .filter(line => line.length > 0) // Remove empty lines
                    .map(line => `<p>${line
                        .replace(/\b([A-Z][a-z]+)\b/g, '<span data-country="$1">$1</span>') // Highlight country names
                        .replace(/\b(\d{1,4})\b/g, '<span data-year="$1">$1</span>') // Highlight years
                    }</p>`) // Wrap each line in <p> tags
                    .join(""); // Join all lines back together

                wikiContent.innerHTML = `
                    <h2>Google Doc Content</h2>
                    <p>${sanitizedText}</p>
                `;
            } catch (error) {
                wikiContent.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }
        } else {
            wikiContent.innerHTML = `<p style="color: red;">Error: Unsupported link type. Please provide a Wikipedia or Google Doc link.</p>`;
        }
    });

    // Handle Wikipedia search form submission
    searchForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const query = document.getElementById("wiki-search").value.trim();

        try {
            // Clear the Wikipedia content box
            wikiContent.innerHTML = "";

            // Query Wikipedia's search API
            const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=${encodeURIComponent(query)}&origin=*`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error("Failed to fetch search results");

            const data = await response.json();
            const results = data.query.search;

            if (results.length > 0) {
                // Display search results
                searchResults.innerHTML = results.map(result => `
                    <div class="search-result" data-title="${result.title}">
                        <strong style="color: blue; cursor: pointer;">${result.title}</strong>
                        <p>${result.snippet}...</p>
                    </div>
                `).join("");

                // Add click event listeners to search results
                document.querySelectorAll(".search-result").forEach(result => {
                    result.addEventListener("click", async () => {
                        const title = result.dataset.title;

                        try {
                            // Fetch the selected Wikipedia page content
                            const pageResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&titles=${encodeURIComponent(title)}&origin=*`);
                            if (!pageResponse.ok) throw new Error("Failed to fetch Wikipedia article");

                            const pageData = await pageResponse.json();
                            const page = Object.values(pageData.query.pages)[0];

                            // Sanitize and display the content in the Wikipedia box
                            const sanitizedExtract = page.extract
                                .replace(/<([^>]+) data-mw-fallback-anchor="[^"]+"([^>]*)>/g, '<$1$2>') // Remove data-mw-fallback-anchor
                                .replace(/\b([A-Z][a-z]+)\b/g, '<span data-country="$1">$1</span>') // Highlight country names
                                .replace(/\b(\d{1,4})\b/g, '<span data-year="$1">$1</span>'); // Highlight years

                            wikiContent.innerHTML = `
                                <div id="wiki-article">
                                    <h2>${page.title}</h2>
                                    <p>${sanitizedExtract}</p>
                                </div>
                            `;
                        } catch (error) {
                            wikiContent.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
                        }
                    });
                });
            } else {
                searchResults.innerHTML = `<p style="color: red;">No results found. Please try a different query.</p>`;
            }
        } catch (error) {
            searchResults.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    });
    // Process instructional text for hover functionality
    const processInstructionalText = () => {
        const wikiContent = document.getElementById("wiki-content");
        const contentHTML = wikiContent.innerHTML;

        // Sanitize and process the instructional text
        const processedHTML = contentHTML
            .replace(/\b([A-Z][a-z]+)\b/g, '<span data-country="$1">$1</span>') // Highlight country names
            .replace(/\b(\d{1,4})\b/g, '<span data-year="$1">$1</span>'); // Highlight years

        wikiContent.innerHTML = processedHTML;
    };

    processInstructionalText();

    const urlParams = new URLSearchParams(window.location.search);
    const sharedWikiLink = urlParams.get("wiki"); // Extract the 'wiki' parameter
    if (sharedWikiLink) {
        const decodedWikiLink = decodeURIComponent(sharedWikiLink);
        document.getElementById("wiki-link").value = decodedWikiLink;
        form.dispatchEvent(new Event("submit")); // Automatically submit the form
    }
    const helpButton = document.getElementById("help-button");
    const helpPopup = document.getElementById("help-popup");
    const helpClose = document.getElementById("help-close");

    // Open the Help popup
    helpButton.addEventListener("click", () => {
        helpPopup.style.display = "flex";
    });

    // Close the Help popup
    helpClose.addEventListener("click", () => {
        helpPopup.style.display = "none";
    });

    // Close the popup when clicking outside the content
    helpPopup.addEventListener("click", (event) => {
        if (event.target === helpPopup) {
            helpPopup.style.display = "none";
        }
    });

    // Open the Share popup
    const shareButton = document.getElementById("share-button");
    const sharePopup = document.getElementById("share-popup");
    const shareClose = document.getElementById("share-close");

    shareButton.addEventListener("click", () => {
        const wikiLink = document.getElementById("wiki-link").value.trim();
        const shareUrlInput = document.getElementById("share-url");
        const serverUrl = "https://globstory.it/";

        if (wikiLink) {
            const encodedWikiLink = encodeURIComponent(wikiLink);
            shareUrlInput.value = `${serverUrl}?wiki=${encodedWikiLink}`;
        } else {
            shareUrlInput.value = "Please enter a valid Wikipedia link first.";
        }

        sharePopup.style.display = "flex";
    });

    const copyButton = document.getElementById("copy-button");
    copyButton.addEventListener("click", () => {
        const shareUrlInput = document.getElementById("share-url");
        shareUrlInput.select();
        document.execCommand("copy");
        alert("Link copied to clipboard!");
    });

    // Handle Embedding Link generation and copying
    const embedCopyButton = document.getElementById("embed-copy-button");
    embedCopyButton.addEventListener("click", () => {
        const embedCodeInput = document.getElementById("embed-code");
        embedCodeInput.select();
        document.execCommand("copy");
        alert("Embedding link copied to clipboard!");
    });

    shareButton.addEventListener("click", () => {
        const wikiLink = document.getElementById("wiki-link").value.trim();
        const embedCodeInput = document.getElementById("embed-code");
        const serverUrl = "https://globstory.it/";

        if (wikiLink) {
            const encodedWikiLink = encodeURIComponent(wikiLink);
            embedCodeInput.value = `<iframe src="${serverUrl}?wiki=${encodedWikiLink}" width="800" height="600" frameborder="0"></iframe>`;
        } else {
            embedCodeInput.value = "Please enter a valid Wikipedia link first.";
        }
    });

    // Close the Share popup
    shareClose.addEventListener("click", () => {
        sharePopup.style.display = "none";
    });

    // Close the popup when clicking outside the content
    sharePopup.addEventListener("click", (event) => {
        if (event.target === sharePopup) {
            sharePopup.style.display = "none";
        }
    });
});

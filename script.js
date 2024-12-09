document.addEventListener("DOMContentLoaded", () => {
    const yearInput = document.getElementById("year-input");
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

        // Update the iframe src with the saved position and new date
        mapIframe.src = `https://embed.openhistoricalmap.org/#map=${mapZoom}/${mapLat}/${mapLon}&layers=O&date=${year}-12-08`;

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

    document.addEventListener("mouseover", (event) => {
        const target = event.target;

        // Check if the hovered element is a country name or a number
        if (target.tagName === "SPAN" && (target.dataset.country || !isNaN(target.textContent))) {
            hoverTimeout = setTimeout(async () => {
                if (target.dataset.country) {
                    const countryName = target.dataset.country;

                    try {
                        // Fetch coordinates from OpenStreetMap
                        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${countryName}`);
                        if (!response.ok) throw new Error("Failed to fetch coordinates");

                        const data = await response.json();
                        if (data.length > 0) {
                            const { lat, lon } = data[0];

                            // Update the map iframe with the new coordinates
                            const url = new URL(mapIframe.src);
                            const hashParams = url.hash.split("&");
                            let mapZoom = "6"; // Default zoom level
                            hashParams.forEach(param => {
                                if (param.startsWith("map=")) {
                                    mapZoom = param.split("=")[1].split("/")[0];
                                }
                            });

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
            }, 1000); // Trigger after 1 second
        }
    });

    document.addEventListener("mouseout", (event) => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
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
    const wikiContent = document.getElementById("wiki-content");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const wikiLink = document.getElementById("wiki-link").value.trim();

        // Extract the language code and page title from the link
        const urlParts = new URL(wikiLink);
        const langCode = urlParts.hostname.split(".")[0]; // Extract language code from the hostname
        const pageTitle = urlParts.pathname.split("/").pop();

        try {
            // Fetch the Wikipedia article content using the language-specific API link format
            const response = await fetch(`https://${langCode}.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles=${pageTitle}&origin=*`);
            if (!response.ok) throw new Error("Failed to fetch Wikipedia article");

            const data = await response.json();
            const page = Object.values(data.query.pages)[0]; // Extract the first page object
            wikiContent.innerHTML = `
                <h2>${page.title}</h2>
                <p>${page.extract.replace(/\b([A-Z][a-z]+)\b/g, '<span data-country="$1">$1</span>').replace(/\b(\d{1,4})\b/g, '<span data-year="$1">$1</span>')}</p>
                <a href="https://en.wikipedia.org/wiki/${page.title}" target="_blank">Read more on Wikipedia</a>
            `;
        } catch (error) {
            wikiContent.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    });

    // Check for shareable link in the URL
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
});

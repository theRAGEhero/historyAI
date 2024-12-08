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

        // Check if the hovered element is a country name
        if (target.tagName === "SPAN" && target.dataset.country) {
            hoverTimeout = setTimeout(async () => {
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
            }, 500); // Trigger after 0.5 seconds
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
        const newYear = parseInt(yearInput.value.trim(), 10);

        if (isNaN(newYear) || newYear < -10000 || newYear > 2050) {
            alert("Please enter a valid year between -10000 and 2050.");
            return;
        }

        updateMapYear(parseInt(newYear, 10));
    });

    // Handle Wikipedia form submission
    const form = document.getElementById("wiki-form");
    const wikiContent = document.getElementById("wiki-content");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const wikiRegex = /^https?:\/\/(www\.)?wikipedia\.org\/wiki\/.+$/; // Regex for Wikipedia links
        const wikiLink = document.getElementById("wiki-link").value.trim();

        if (!wikiRegex.test(wikiLink)) {
            alert("Please enter a valid Wikipedia link.");
            return;
        }
        event.preventDefault();
        const wikiLink = document.getElementById("wiki-link").value.trim();

        // Extract the Wikipedia page title from the link
        const pageTitle = wikiLink.split("/").pop();

        try {
            // Fetch the Wikipedia article content using the new API link format
            const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles=${pageTitle}&origin=*`);
            if (!response.ok) throw new Error("Failed to fetch Wikipedia article");

            const data = await response.json();
            const page = Object.values(data.query.pages)[0]; // Extract the first page object
            wikiContent.innerHTML = `
                <h2>${page.title}</h2>
                <p>${page.extract.replace(/\b([A-Z][a-z]+)\b/g, '<span data-country="$1">$1</span>')}</p>
                <a href="https://en.wikipedia.org/wiki/${page.title}" target="_blank">Read more on Wikipedia</a>
            `;
        } catch (error) {
            wikiContent.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    });
});

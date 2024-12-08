document.addEventListener("DOMContentLoaded", () => {
    // Initialize the map
    const map = L.map('map').setView([0, 0], 2); // Default view
    L.tileLayer('https://tile.openhistoricalmap.org/ohm/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenHistoricalMap contributors'
    }).addTo(map);

    // Handle Wikipedia form submission
    const form = document.getElementById("wiki-form");
    const wikiContent = document.getElementById("wiki-content");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const wikiLink = document.getElementById("wiki-link").value;

        // Extract the Wikipedia page title from the link
        const pageTitle = wikiLink.split("/").pop();

        try {
            // Fetch the Wikipedia article content
            const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${pageTitle}`);
            if (!response.ok) throw new Error("Failed to fetch Wikipedia article");

            const data = await response.json();
            wikiContent.innerHTML = `
                <h2>${data.title}</h2>
                <p>${data.extract}</p>
                <a href="${data.content_urls.desktop.page}" target="_blank">Read more on Wikipedia</a>
            `;
        } catch (error) {
            wikiContent.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    });
});

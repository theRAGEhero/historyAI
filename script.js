document.addEventListener("DOMContentLoaded", () => {
    const yearInput = document.getElementById("year-input");
    const yearForm = document.getElementById("year-form");
    const mapIframe = document.querySelector("#map-container iframe");

    const yearIndicator = document.getElementById("year-indicator");

    const updateMapYear = (year) => {
        const url = new URL(mapIframe.src);
        const params = new URLSearchParams(url.search);
        params.set("date", `${year}-12-08`);
        params.set("layers", "O"); // Ensure the correct layer is applied
        url.search = params.toString();
        mapIframe.src = url.toString();

        // Update the year indicator
        yearIndicator.textContent = `Year: ${year}`;
    };

    const adjustYear = (delta) => {
        const currentYear = parseInt(yearInput.value, 10);
        const newYear = currentYear + delta;
        yearInput.value = newYear;
        updateMapYear(newYear);
    };

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
                <p>${page.extract}</p>
                <a href="https://en.wikipedia.org/wiki/${page.title}" target="_blank">Read more on Wikipedia</a>
            `;
        } catch (error) {
            wikiContent.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    });
});

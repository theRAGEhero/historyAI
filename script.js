document.addEventListener("DOMContentLoaded", () => {

    // Handle Wikipedia form submission
    const form = document.getElementById("wiki-form");
    const wikiContent = document.getElementById("wiki-content");

    // Handle Wikipedia form submission
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

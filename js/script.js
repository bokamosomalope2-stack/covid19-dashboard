let trendChart = null;
let dailyChart = null;
let covidData = null;

// Load COVID-19 data from JSON
async function loadData() {
    try {
        const response = await fetch("data/covid-19.json");

        if (!response.ok) {
            throw new Error("Could not load JSON file");
        }

        covidData = await response.json();

        console.log("COVID-19 data loaded:", covidData);

        const countrySelect = document.getElementById("countrySelect");

        // Populate dropdown from dataset
        countrySelect.innerHTML = "";

        covidData.countries.forEach(country => {
            const option = document.createElement("option");
            option.value = country.country;
            option.textContent = country.country;
            countrySelect.appendChild(option);
        });

        countrySelect.addEventListener("change", updateDashboard);

        updateDashboard();

    } catch (error) {
        console.error("Error loading data:", error);
        alert("Unable to load COVID-19 data. Check your JSON file.");
    }
}

// Update dashboard when country changes
function updateDashboard() {
    const selectedCountry =
        document.getElementById("countrySelect").value;

    const country = covidData.countries.find(
        item => item.country === selectedCountry
    );

    if (!country || !country.data.length) {
        return;
    }

    const records = [...country.data].sort(
        (a, b) => a.date.localeCompare(b.date)
    );

    const latest = records[records.length - 1];

    const active =
        latest.confirmed - latest.deaths - latest.recovered;

    // Update metric cards
    document.getElementById("confirmed").textContent =
        latest.confirmed.toLocaleString();

    document.getElementById("deaths").textContent =
        latest.deaths.toLocaleString();

    document.getElementById("recovered").textContent =
        latest.recovered.toLocaleString();

    document.getElementById("active").textContent =
        active.toLocaleString();

    const dates = records.map(item => item.date);
    const confirmed = records.map(item => item.confirmed);
    const deaths = records.map(item => item.deaths);
    const recovered = records.map(item => item.recovered);

    // Calculate changes between recorded dates
    const newCases = records.map((item, index) => {
        if (index === 0) return null;

        return item.confirmed - records[index - 1].confirmed;
    });

    // Remove previous charts
    if (trendChart) trendChart.destroy();
    if (dailyChart) dailyChart.destroy();

    // Line chart
    trendChart = new Chart(
        document.getElementById("trendChart"),
        {
            type: "line",
            data: {
                labels: dates,
                datasets: [
                    {
                        label: "Confirmed Cases",
                        data: confirmed,
                        borderColor: "#2563eb",
                        tension: 0.3
                    },
                    {
                        label: "Deaths",
                        data: deaths,
                        borderColor: "#ef4444",
                        tension: 0.3
                    },
                    {
                        label: "Recoveries",
                        data: recovered,
                        borderColor: "#22c55e",
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: selectedCountry + " COVID-19 Trends"
                    }
                }
            }
        }
    );

    // Bar chart: changes between available dates
    dailyChart = new Chart(
        document.getElementById("dailyChart"),
        {
            type: "bar",
            data: {
                labels: dates,
                datasets: [{
                    label: "New Cases Since Previous Record",
                    data: newCases,
                    backgroundColor: "#f59e0b"
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y === null
                                    ? "No previous record"
                                    : "New cases: " + context.parsed.y;
                            }
                        }
                    }
                }
            }
        }
    );
}

// Start dashboard
loadData();
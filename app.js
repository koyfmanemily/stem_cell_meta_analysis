
function calculateSD(error, n, errorType) {
    errorType = errorType.trim().toUpperCase();

    if (errorType === "SEM") {
        return error * Math.sqrt(n);
    }

    if (errorType === "SD") {
        return error;
    }

    throw new Error("Invalid error type");
}

async function loadStudies() {
    const response = await fetch("./data/studies.csv", {
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error("Could not load studies.csv");
    }

    const csv = await response.text();

    // Turn the CSV into rows
    const lines = csv.trim().split(/\r?\n/);
    const headers = lines[0].split(",");
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase());

    const studies = lines.slice(1).map(line => {
        const values = line.split(",");
        const study = {};

        normalizedHeaders.forEach((header, index) => {
            study[header.trim().toLowerCase()] =
                values[index].trim();
        });

        return study;
    });

    // Calculate Hedges' g for every study
    studies.forEach(study => {
        const nT = Number(study.n_treat);
        const meanT = Number(study.mean_treat);

        const nC = Number(study.n_control);
        const meanC = Number(study.mean_control);

        // Automatically calculate standard deviations
        const sdT = calculateSD(
            Number(study.error_treat),
            nT,
            study.error_type
        );

        const sdC = calculateSD(
            Number(study.error_control),
            nC,
            study.error_type
        );

        // Calculate pooled standard deviation
        const df = nT + nC - 2;

        const pooledSD = Math.sqrt(
            ((nT - 1) * sdT ** 2 +
             (nC - 1) * sdC ** 2) / df
        );

        // Calculate Cohen's d
        const d = (meanT - meanC) / pooledSD;

        // Apply Hedges' correction
        const correction = 1 - 3 / (4 * df - 1);

        let g = d * correction;

        // Make positive values mean improvement
        if (study.direction.toLowerCase() === "lower") {
            g = -g;
        }

        study.hedgesG = g;
        study.sdTreat = sdT;
        study.sdControl = sdC;
    });

    // Show results on the website
    const results = document.getElementById("results");

    results.innerHTML = studies.map(study => `
        <p>
            <strong>${study.study} (${study.therapy})</strong><br>
            Outcome: ${study.outcome}<br>
            Treatment SD: ${study.sdTreat.toFixed(3)}<br>
            Control SD: ${study.sdControl.toFixed(3)}<br>
            Hedges' g: ${study.hedgesG.toFixed(3)}
        </p>
    `).join("");

    console.log(studies);
}

loadStudies().catch(console.error);


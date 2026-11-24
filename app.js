function calculateSD(error, n, errorType) {
    if (errorType.toUpperCase() === "SEM") {
        return error * Math.sqrt(n);
    } else if (errorType.toUpperCase() === "SD") {
        return error;
    } else {
        throw new Error("Invalid error type");
    }
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

  const studies = lines.slice(1).map(line => {
    const values = line.split(",");
    const study = {};

    headers.forEach((header, index) => {
      study[header.trim().toLowerCase()] = values[index].trim();
    });

    return study;
  });

  // Calculate Hedges' g for every study
  studies.forEach(study => {
    const nT = Number(study.n_treat);
    const meanT = Number(study.mean_treat);
    const sdT = calculateSD(
    Number(study.error_treat),
    Number(study.n_treat),
    study.error_type
);

    const nC = Number(study.n_control);
    const meanC = Number(study.mean_control);
    const sdC = calculateSD(
    Number(study.error_control),
    Number(study.n_control),
    study.error_type
);

    const df = nT + nC - 2;

    const pooledSD = Math.sqrt(
      ((nT - 1) * sdT ** 2 +
       (nC - 1) * sdC ** 2) / df
    );

    const d = (meanT - meanC) / pooledSD;
    const correction = 1 - 3 / (4 * df - 1);

    let g = d * correction;

    // Make positive values mean improvement
    if (study.direction === "lower") {
      g = -g;
    }

    study.hedgesG = g;
  });

  // Show the results on the website
  const results = document.getElementById("results");

  results.innerHTML = studies.map(study => `
    <p>
      <strong>${study.study} (${study.therapy})</strong><br>
      Outcome: ${study.outcome}<br>
      Hedges' g: ${study.hedgesG.toFixed(3)}
    </p>
  `).join("");

  console.log(studies);
}

loadStudies().catch(console.error);

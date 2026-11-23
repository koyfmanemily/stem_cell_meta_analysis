async function loadStudies() {
  const response = await fetch("./data/studies.csv");

  if (!response.ok) {
    throw new Error("Could not load studies.csv");
  }

  const csv = await response.text();

  console.log(csv);
}

loadStudies();

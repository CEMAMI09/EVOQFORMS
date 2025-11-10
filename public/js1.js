const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");

// Hamburger click for mobile
hamburger.addEventListener("click", () => {
  sidebar.classList.toggle("show");
});

// Page navigation
const pages = document.querySelectorAll(".page");
const navItems = document.querySelectorAll(".sidebar ul li");

navItems.forEach(item => {
  item.addEventListener("click", () => {
    // Highlight active nav item
    navItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    // Show the selected page
    const target = item.dataset.page;
    pages.forEach(page => page.classList.remove("active"));
    document.getElementById(target).classList.add("active");

    // Load intake forms when on intake page
    if (target === "intake") loadIntakeForms();
  });
});

// Fetch intake forms
async function loadIntakeForms() {
  const tableBody = document.querySelector("#intakeTable tbody");
  tableBody.innerHTML = `<tr><td colspan="12" style="text-align:center;">Loading data...</td></tr>`;

  try {
    const res = await fetch(`${window.location.origin}/api/intake-forms`);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const data = await res.json();

    if (!data || data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="12" style="text-align:center;">No data found</td></tr>`;
      return;
    }

    tableBody.innerHTML = data.map(item => `
      <tr>
        <td>${item.id}</td>
        <td>${item.accountName}</td>
        <td>${item.primaryEmail}</td>
        <td>${item.backupEmail}</td>
        <td>${item.locationAddress}</td>
        <td>${item.keyContact}</td>
        <td>${item.billingInfo}</td>
        <td>${item.patientPopulation}</td>
        <td>${item.otherPatientInfo || ""}</td>
        <td>${item.wifiSettings}</td>
        <td>${item.ehrSystems}</td>
        <td>${item.practiceLogoPath ? `<img class="logo" src="/${item.practiceLogoPath.replace(/\\/g,"/")}" />` : ""}</td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Error loading intake forms:", err);
    tableBody.innerHTML = `<tr><td colspan="12" style="text-align:center; color:red;">Error loading data</td></tr>`;
  }
}

// Auto load intake forms if active
document.addEventListener("DOMContentLoaded", () => {
  const activePage = document.querySelector(".page.active");
  if (activePage && activePage.id === "intake") loadIntakeForms();
});

const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");

// Quiz questions array
const quizQuestions = [
  "What CPT code is used for dark adaptation test reimbursement in patients meeting medical necessity criteria?",
  "What are three patient groups who should routinely receive Twilight testing?",
  "How long does a Twilight rapid dark adaptation test typically take?",
  "Where is the optimal placement for Twilight in clinic workflow?",
  "What age threshold triggers routine testing?",
  "What is the reimbursement pathway for CPT 92284 for tests conducted in patients with medical necessity?",
  "Which common diagnostics are usually performed after a Twilight-positive finding to identify reasons for delayed dark adaptation?",
  "How do you confirm headset and earphone functionality?",
  "What are the obligations of a 'Twilight Champion'?",
  "How long is an operator's certification valid before renewal?"
];

let allQuizSubmissions = [];

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

    // Load data when on respective pages
    if (target === "intake") loadIntakeForms();
    if (target === "quiz") loadQuizSubmissions();

    // Close sidebar on mobile after selection
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("show");
    }
  });
});

// ============= INTAKE FORMS =============
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

// ============= QUIZ SUBMISSIONS =============
async function loadQuizSubmissions() {
  const tableBody = document.querySelector("#quizTable tbody");
  tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Loading quiz data...</td></tr>`;

  try {
    const res = await fetch(`${window.location.origin}/api/quiz-submissions`);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const data = await res.json();

    allQuizSubmissions = data;
    displayQuizTable(data);
    updateQuizStats(data);

  } catch (err) {
    console.error("Error loading quiz submissions:", err);
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error loading quiz data</td></tr>`;
  }
}

function displayQuizTable(data) {
  const tableBody = document.querySelector("#quizTable tbody");

  if (!data || data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No quiz submissions found</td></tr>`;
    return;
  }

  tableBody.innerHTML = data.map(submission => `
    <tr>
      <td>#${submission.id}</td>
      <td>${submission.clientName}</td>
      <td><span class="${getScoreClass(submission.score)}">${submission.score}/10</span></td>
      <td>${formatDate(submission.submittedAt)}</td>
      <td>
        <button class="view-btn" onclick="viewQuizDetails(${submission.id})">View Details</button>
      </td>
    </tr>
  `).join("");
}

function getScoreClass(score) {
  if (score >= 8) return 'score-badge score-high';
  if (score >= 5) return 'score-badge score-medium';
  return 'score-badge score-low';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function updateQuizStats(data) {
  // Total submissions
  document.getElementById('totalSubmissions').textContent = data.length;
  
  // Average score
  const avgScore = data.length > 0 
    ? (data.reduce((sum, s) => sum + s.score, 0) / data.length).toFixed(1)
    : 0;
  document.getElementById('avgScore').textContent = `${avgScore}/10`;
  
  // Today's submissions
  const today = new Date().toDateString();
  const todayCount = data.filter(s => 
    new Date(s.submittedAt).toDateString() === today
  ).length;
  document.getElementById('todaySubmissions').textContent = todayCount;
}

// Search functionality
const searchBox = document.getElementById('searchBox');
if (searchBox) {
  searchBox.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allQuizSubmissions.filter(s => 
      s.clientName.toLowerCase().includes(searchTerm)
    );
    displayQuizTable(filtered);
  });
}

// View quiz details modal
window.viewQuizDetails = async function(id) {
  try {
    const res = await fetch(`${window.location.origin}/api/quiz-submissions/${id}`);
    if (!res.ok) throw new Error('Failed to fetch quiz details');
    
    const submission = await res.json();
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <div class="modal-info">
        <div class="info-item">
          <label>Client Name</label>
          <p>${submission.clientName}</p>
        </div>
        <div class="info-item">
          <label>Score</label>
          <p><span class="${getScoreClass(submission.score)}">${submission.score}/10</span></p>
        </div>
        <div class="info-item">
          <label>Submitted At</label>
          <p>${formatDate(submission.submittedAt)}</p>
        </div>
      </div>
      <div class="answers-section">
        <h3>Quiz Answers</h3>
        ${quizQuestions.map((q, i) => `
          <div class="answer-item">
            <div class="answer-question">Question ${i + 1}: ${q}</div>
            <div class="answer-text">${submission['question' + (i + 1)] || '<em style="color: #a0aec0;">No answer provided</em>'}</div>
          </div>
        `).join('')}
      </div>
    `;
    
    document.getElementById('detailModal').classList.add('active');
  } catch (err) {
    console.error('Error loading quiz details:', err);
    alert('Error loading quiz details');
  }
};

// Close modal
window.closeModal = function() {
  document.getElementById('detailModal').classList.remove('active');
};

// Close modal when clicking outside
document.getElementById('detailModal').addEventListener('click', (e) => {
  if (e.target.id === 'detailModal') {
    closeModal();
  }
});

// Auto load data if on active page
document.addEventListener("DOMContentLoaded", () => {
  const activePage = document.querySelector(".page.active");
  if (activePage) {
    if (activePage.id === "intake") loadIntakeForms();
    if (activePage.id === "quiz") loadQuizSubmissions();
  }
});
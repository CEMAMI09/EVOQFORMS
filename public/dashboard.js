// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard JS loaded");
  
  const hamburger = document.getElementById("hamburger");
  const sidebar = document.getElementById("sidebar");
  const pages = document.querySelectorAll(".page");
  const navItems = document.querySelectorAll(".sidebar ul li");

  console.log("Found", navItems.length, "nav items");
  console.log("Found", pages.length, "pages");

  // Hamburger click for mobile
  if (hamburger && sidebar) {
    hamburger.addEventListener("click", () => {
      sidebar.classList.toggle("show");
    });
  }

  // Page navigation
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const target = item.dataset.page;
      console.log("Clicked:", target);
      
      // Highlight active nav item
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      // Show the selected page
      pages.forEach(page => page.classList.remove("active"));
      const targetPage = document.getElementById(target);
      if (targetPage) {
        targetPage.classList.add("active");
        console.log("Showing page:", target);
      }

      // Load data when on respective pages
      if (target === "intake") loadIntakeForms();
      if (target === "quiz") loadQuizSubmissions();

      // Close sidebar on mobile after selection
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("show");
      }
    });
  });

  // Auto load data if on active page
  const activePage = document.querySelector(".page.active");
  if (activePage) {
    if (activePage.id === "intake") loadIntakeForms();
    if (activePage.id === "quiz") loadQuizSubmissions();
  }
});

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

// ============= INTAKE FORMS =============
async function loadIntakeForms() {
  const tableBody = document.querySelector("#intakeTable tbody");
  tableBody.innerHTML = `<tr><td colspan="14" style="text-align:center;">Loading data...</td></tr>`;

  try {
    const res = await fetch(`${window.location.origin}/api/intake-forms`);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const data = await res.json();

    if (!data || data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="14" style="text-align:center;">No data found</td></tr>`;
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
        <td>${item.billingAddress || ''}</td>
        <td>${item.cardName || ''}</td>
        <td>${item.patientPopulation}</td>
        <td>${item.wifiSSID || ''}</td>
        <td>${item.wifiSecurity || ''}</td>
        <td>${item.ehrSystems}</td>
        <td>${item.practiceLogoPath ? `<img class="logo" src="/${item.practiceLogoPath.replace(/\\/g,"/")}" />` : ''}</td>
        <td>
          <button class="view-btn" onclick="viewIntakeDetails(${item.id})">View Full Details</button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Error loading intake forms:", err);
    tableBody.innerHTML = `<tr><td colspan="14" style="text-align:center; color:red;">Error loading data</td></tr>`;
  }
}

// View intake form details modal
window.viewIntakeDetails = async function(id) {
  try {
    const res = await fetch(`${window.location.origin}/api/intake-forms`);
    if (!res.ok) throw new Error('Failed to fetch data');
    
    const data = await res.json();
    const item = data.find(i => i.id === id);
    
    if (!item) {
      alert('Form not found');
      return;
    }
    
    window.toggleSensitiveData = function(element) {
      const masked = element.querySelector('.masked');
      const revealed = element.querySelector('.revealed');
      
      if (masked && revealed) {
        if (masked.style.display === 'none') {
          masked.style.display = 'inline';
          revealed.style.display = 'none';
        } else {
          masked.style.display = 'none';
          revealed.style.display = 'inline';
        }
      }
    };
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <div class="modal-info">
        <div class="info-item">
          <label>Account Name</label>
          <p>${item.accountName}</p>
        </div>
        <div class="info-item">
          <label>Primary Email</label>
          <p>${item.primaryEmail}</p>
        </div>
        <div class="info-item">
          <label>Backup Email</label>
          <p>${item.backupEmail}</p>
        </div>
        <div class="info-item">
          <label>Location</label>
          <p>${item.locationAddress}</p>
        </div>
        <div class="info-item">
          <label>Key Contact</label>
          <p>${item.keyContact}</p>
        </div>
        <div class="info-item">
          <label>Patient Population</label>
          <p>${item.patientPopulation}</p>
        </div>
        ${item.otherPatientInfo ? `
        <div class="info-item" style="grid-column: span 2;">
          <label>Other Patient Info</label>
          <p>${item.otherPatientInfo}</p>
        </div>
        ` : ''}
        <div class="info-item">
          <label>EHR Systems</label>
          <p>${item.ehrSystems}</p>
        </div>
      </div>
      
      <div class="answers-section">
        <h3>Billing Information</h3>
        <div class="modal-info">
          <div class="info-item">
            <label>Billing Address</label>
            <p>${item.billingAddress || 'N/A'}</p>
          </div>
          <div class="info-item">
            <label>Name on Card</label>
            <p>${item.cardName || 'N/A'}</p>
          </div>
          <div class="info-item">
            <label>Card Number</label>
            <p class="sensitive-data" onclick="toggleSensitiveData(this)">
              <span class="masked">****  ****  ****  ${item.cardNumber ? item.cardNumber.slice(-4) : 'N/A'}</span>
              <span class="revealed" style="display: none;">${item.cardNumber || 'N/A'}</span>
              <span class="toggle-icon">👁️</span>
            </p>
          </div>
          <div class="info-item">
            <label>Expiration</label>
            <p>${item.cardExpiry || 'N/A'}</p>
          </div>
          <div class="info-item">
            <label>CVV</label>
            <p class="sensitive-data" onclick="toggleSensitiveData(this)">
              <span class="masked">•••</span>
              <span class="revealed" style="display: none;">${item.cardCVV || 'N/A'}</span>
              <span class="toggle-icon">👁️</span>
            </p>
          </div>
          <div class="info-item">
            <label>Zip Code</label>
            <p>${item.billingZipCode || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div class="answers-section">
        <h3>WiFi Settings</h3>
        <div class="modal-info">
          <div class="info-item">
            <label>Network Name (SSID)</label>
            <p>${item.wifiSSID || 'N/A'}</p>
          </div>
          <div class="info-item">
            <label>Password</label>
            <p class="sensitive-data" onclick="toggleSensitiveData(this)">
              <span class="masked">••••••••</span>
              <span class="revealed" style="display: none;">${item.wifiPassword || 'N/A'}</span>
              <span class="toggle-icon">👁️</span>
            </p>
          </div>
          <div class="info-item">
            <label>Security Type</label>
            <p>${item.wifiSecurity || 'N/A'}</p>
          </div>
          <div class="info-item">
            <label>Frequency</label>
            <p>${item.wifiFrequency || 'N/A'}</p>
          </div>
        </div>
      </div>

      ${item.practiceLogoPath ? `
      <div class="answers-section">
        <h3>Practice Logo</h3>
        <img src="/${item.practiceLogoPath.replace(/\\/g,"/")}" style="max-width: 200px; border-radius: 8px;" />
      </div>
      ` : ''}
    `;
    
    document.getElementById('detailModal').classList.add('active');
  } catch (err) {
    console.error('Error loading details:', err);
    alert('Error loading form details');
  }
};

// ============= QUIZ SUBMISSIONS =============
async function loadQuizSubmissions() {
  const tableBody = document.querySelector("#quizTable tbody");
  tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Loading quiz data...</td></tr>`;

  try {
    const res = await fetch(`${window.location.origin}/api/quiz-submissions`);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const data = await res.json();

    allQuizSubmissions = data;
    displayQuizTable(data);
    updateQuizStats(data);

  } catch (err) {
    console.error("Error loading quiz submissions:", err);
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Error loading quiz data</td></tr>`;
  }
}

// Helper function to determine pass/fail
function getPassFailStatus(score) {
  return score >= 8 ? 'PASS' : 'FAIL';
}

// Helper function to get pass/fail badge class
function getPassFailClass(score) {
  return score >= 8 ? 'pass-badge' : 'fail-badge';
}

function displayQuizTable(data) {
  const tableBody = document.querySelector("#quizTable tbody");

  if (!data || data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No quiz submissions found</td></tr>`;
    return;
  }

  tableBody.innerHTML = data.map(submission => `
    <tr>
      <td>#${submission.id}</td>
      <td>${submission.clientName}</td>
      <td><span class="${getScoreClass(submission.score)}">${submission.score}/10</span></td>
      <td><span class="${getPassFailClass(submission.score)}">${getPassFailStatus(submission.score)}</span></td>
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
document.addEventListener('DOMContentLoaded', () => {
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
});

// View quiz details modal
window.viewQuizDetails = async function(id) {
  try {
    const res = await fetch(`${window.location.origin}/api/quiz-submissions/${id}`);
    if (!res.ok) throw new Error('Failed to fetch quiz details');
    
    const submission = await res.json();
    const passFailStatus = getPassFailStatus(submission.score);
    const passFailClass = getPassFailClass(submission.score);
    
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
          <label>Result</label>
          <p><span class="${passFailClass}">${passFailStatus}</span></p>
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
const detailModal = document.getElementById('detailModal');
if (detailModal) {
  detailModal.addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') {
      closeModal();
    }
  });
}

// Auto load data if on active page
document.addEventListener("DOMContentLoaded", () => {
  const activePage = document.querySelector(".page.active");
  if (activePage) {
    if (activePage.id === "intake") loadIntakeForms();
    if (activePage.id === "quiz") loadQuizSubmissions();
  }
});
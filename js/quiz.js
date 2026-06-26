const user = JSON.parse(localStorage.getItem('upscUser'));
if (!user) window.location.href = 'index.html';

document.getElementById('userName').textContent = user.name;

let questions = [];
let currentQuestion = 0;
let userAnswers = [];
let startTime = Date.now();
let timerInterval;

// Load questions
google.script.run
    .withSuccessHandler((data) => {
        questions = data;
        if (questions.length > 0) {
            loadQuestion();
            startTimer();
        } else {
            alert('No quiz available for today');
        }
    })
    .getDailyQuiz();

function loadQuestion() {
    const q = questions[currentQuestion];
    document.getElementById('questionText').textContent = q.question;
    document.getElementById('currentQ').textContent = currentQuestion + 1;
    document.getElementById('totalQ').textContent = questions.length;
    
    const options = q.options.split('|'); // Assuming options are stored as "A|B|C|D"
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    options.forEach((option, index) => {
        const label = String.fromCharCode(65 + index); // A, B, C, D
        const div = document.createElement('div');
        div.className = 'option';
        div.innerHTML = `
            <input type="radio" name="answer" id="opt${index}" value="${label}" 
                ${userAnswers[currentQuestion] === label ? 'checked' : ''}>
            <label for="opt${index}">${label}. ${option}</label>
        `;
        optionsContainer.appendChild(div);
    });
    
    // Show/hide buttons
    document.getElementById('prevBtn').style.display = currentQuestion === 0 ? 'none' : 'inline-block';
    document.getElementById('nextBtn').style.display = currentQuestion === questions.length - 1 ? 'none' : 'inline-block';
    document.getElementById('submitBtn').style.display = currentQuestion === questions.length - 1 ? 'inline-block' : 'none';
}

function saveAnswer() {
    const selected = document.querySelector('input[name="answer"]:checked');
    if (selected) {
        userAnswers[currentQuestion] = selected.value;
    }
}

function nextQuestion() {
    saveAnswer();
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        loadQuestion();
    }
}

function previousQuestion() {
    saveAnswer();
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion();
    }
}

function submitQuiz() {
    saveAnswer();
    clearInterval(timerInterval);
    
    let correct = 0;
    let wrong = 0;
    
    questions.forEach((q, index) => {
        if (userAnswers[index] === q.correctAns) {
            correct++;
        } else if (userAnswers[index]) {
            wrong++;
        }
    });
    
    const score = correct * 2 - wrong * 0.66; // UPSC marking scheme
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    // Save result
    google.script.run
        .withSuccessHandler(() => {
            showResult(correct, wrong, score);
        })
        .saveTestResult(user.userId, {
            subject: 'Daily Quiz',
            questionsAttempted: questions.length,
            correct: correct,
            wrong: wrong,
            score: score.toFixed(2),
            timeSpent: timeTaken
        });
}

function showResult(correct, wrong, score) {
    document.getElementById('quizContent').style.display = 'none';
    document.getElementById('resultSection').style.display = 'block';
    
    document.getElementById('finalScore').textContent = score.toFixed(2);
    document.getElementById('correctAns').textContent = correct;
    document.getElementById('wrongAns').textContent = wrong;
    document.getElementById('accuracyPer').textContent = ((correct / questions.length) * 100).toFixed(2);
}

function startTimer() {
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('timer').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function logout() {
    localStorage.removeItem('upscUser');
    window.location.href = 'index.html';
}

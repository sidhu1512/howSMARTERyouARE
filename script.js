const fileCounts = { 
    mmlu: 280, hellaswag: 200, arc: 23, truthfulqa: 16, race: 69, mathqa: 656,
    aqua: 5, winogrande: 25, commonsense: 24, sciq: 20, piqa: 36, openbook: 10
};

let currData = [];
let currQuestion = 0;
let score = 0;
let currCategoryName = "";
let chartInstance = null;

// --- FUNNY COMMENTS DATABASE ---
const remarks = {
    low: [ 
        "You are officially dumber than an average human.",
        "Ooh man, you need to take admission in 3rd grade.",
        "I guess you are hungry? That's why your brain isn't working.",
        "Even a random number generator would score higher.",
        "My calculator is laughing at you right now.",
        "Did you sleep through the entire quiz?",
        "My toaster has more processing power than this.",
        "Are you clicking randomly or are you actually this lost?",
        "This score is a crime against intelligence.",
        "I have seen goldfish with better attention spans.",
        "Did you forget to turn your brain on before starting?",
        "Is this a joke? Because nobody is laughing.",
        "A monkey with a typewriter would statistically do better.",
        "Please stop, you are embarrassing the human race.",
        "Error 404: Intelligence not found.",
        "I am actually impressed by how consistently wrong you were.",
        "You are making the AI look like a genius.",
        "Maybe try reading the questions next time?",
        "Your logic is flawed. Deeply flawed.",
        "I would explain why you are wrong, but I do not think you would understand.",
        "This is why aliens refuse to talk to us."
    ],
    mid: [ 
        "Not terrible, but AI is still smarter than you.",
        "You are average. Just... painfully average.",
        "Acceptable, but do not quit your day job.",
        "You tried. That is what counts... right?",
        "Mediocrity at its finest.",
        "You exist. That is about all I can say.",
        "Not great, not terrible. Just meh.",
        "You are the human equivalent of the color beige.",
        "I have seen better, but I have definitely seen worse.",
        "You are definitely one of the humans of all time.",
        "Participation trophy material right here.",
        "Middle of the road. Boring.",
        "You got some right. Was it by accident?",
        "Totally adequate. Nothing more.",
        "Standard human performance. Underwhelming.",
        "You are perfectly average. Congratulations?",
        "The AI remains unimpressed by your efforts.",
        "Keep practicing. Or do not. It does not matter.",
        "You are statistically insignificant."
    ],
    high: [ 
        "Okay, you are actually pretty sharp!",
        "Not bad! You might survive the AI uprising.",
        "You are smarter than 80% of the internet.",
        "Respectable effort. You clearly know things.",
        "Solid performance. I am almost proud.",
        "You are clearly paying attention.",
        "Above average. Very nice.",
        "I would trust you to solve a captcha.",
        "You might actually be useful in the future.",
        "Impressive. Most impressive.",
        "You are giving the AI a run for its money.",
        "Smart enough to be dangerous.",
        "Well done. You passed the test.",
        "You have a functioning brain. Rare these days.",
        "Good job, human.",
        "You beat the curve. Well played.",
        "Commendable logic and reasoning.",
        "You are actually using your head. Good to see."
    ],
    god: [ 
        "Ooh, you can give tuition to these AIs!",
        "Genius level detected. Are you a cyborg?",
        "Absolute perfection. You should be running this simulation.",
        "Bow down to the new overlord!",
        "Your brain is massive.",
        "Are you cheating? You are almost too good.",
        "The singularity is here, and it is you.",
        "Unstoppable intellect detected.",
        "You just broke the benchmark.",
        "AI models study you to get smarter.",
        "Peerless. Flawless. Legend.",
        "You operate on a higher plane of existence.",
        "Pure brilliance in action.",
        "The Turing test was made for people like you.",
        "Limitless potential.",
        "You are the apex intelligence.",
        "Logic personified.",
        "We are not worthy of this score.",
        "System overload. Too much smart."
    ]
};

function getQuestions(categoryName){
    currCategoryName = categoryName;
    currQuestion = 0;
    score = 0;
    
    // Safety check to prevent 404s if file count is 0
    if (fileCounts[categoryName] === 0) {
        alert("No data available for this category yet!");
        return;
    }

    const randNum = Math.floor(Math.random() * fileCounts[categoryName]);
    const url = `./data/${categoryName}/${randNum}.json`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        currData = data;
        openModelPopup(categoryName, data);
    })
    .catch(error => console.log("Error:", error));
}

function openModelPopup(categoryName, data){
    currQuestion = 0;
    score = 0;
    document.getElementById('quiz-modal').classList.remove('hidden');
    loadQuestion();
}

function closeModal(){
    document.getElementById('quiz-modal').classList.add('hidden');
}

function loadQuestion(){
    document.getElementById('finish-btn').disabled = (currQuestion === 0);
    const qData = currData[currQuestion];
    
    // Reset Copy Icon
    const copyBtn = document.querySelector('.copy-btn');
    copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy`;
    copyBtn.classList.remove('copied');

    const qNum = (currQuestion + 1).toString().padStart(2, '0');
    // Adjust total if dataset is smaller than 50
    const totalQs = Math.min(50, currData.length);
    document.getElementById('question-counter').innerText = `${qNum} / ${totalQs}`;
    
    document.getElementById('question-text').innerText = qData.question;
    
    const container = document.getElementById('options-grid');
    container.innerHTML = "";
    
    qData.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(i, btn, qData.answer);
        container.appendChild(btn);
    });

    document.getElementById('next-btn').disabled = true;
}

function checkAnswer(i, btn, answer){
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);

    if(i === answer){
        btn.classList.add('correct');
        score++;
    } else {
        btn.classList.add('wrong');
        allBtns[answer].classList.add('correct');
    }
    document.getElementById('next-btn').disabled = false;
}

function nextQuestion(){
    // Check if there are more questions
    if (currQuestion < currData.length - 1 && currQuestion < 49){
        currQuestion++;
        loadQuestion();
    } else {
        finish();
    }
}

function finish(){
    closeModal();
    showchart();
}

// --- Copy Icon Animation ---
function copyQuestion() {
    const text = document.getElementById('question-text').innerText;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.copy-btn');
        // Change to Check Icon
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> <span style="color:#22c55e">Copied</span>`;
        
        // Revert after 2 seconds
        setTimeout(() => {
            btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy`;
        }, 2000);
    });
}

async function showchart() {
    document.getElementById('chart-model').classList.remove('hidden');

    const totalQs = (currQuestion === 0 ? 1 : currQuestion + 1);
    const userScore = (score / totalQs) * 100;

    // --- Generate Dynamic Roast/Praise ---
    let comment = "";
    if (userScore <= 30) comment = remarks.low[Math.floor(Math.random() * remarks.low.length)];
    else if (userScore <= 60) comment = remarks.mid[Math.floor(Math.random() * remarks.mid.length)];
    else if (userScore <= 80) comment = remarks.high[Math.floor(Math.random() * remarks.high.length)];
    else comment = remarks.god[Math.floor(Math.random() * remarks.god.length)];

    document.getElementById('result-comment').innerText = comment;

    // Chart Data Setup
    let seriesData = [];
    let categories = [];

    try {
        const response = await fetch("./data/models.json");
        const allData = await response.json();
        const benchmark = allData[currCategoryName];

        if(benchmark){
            benchmark.labels.forEach((label, index) => {
                if(label !== "You") {
                    categories.push(label);
                    seriesData.push(benchmark.scores[index]);
                }
            });
        }
    } catch(e) {
        categories = ["Avg Human", "GPT-4"];
        seriesData = [50, 85];
    }

    categories.push("YOU");
    seriesData.push(userScore.toFixed(1));

    if(chartInstance) chartInstance.destroy();

    var options = {
        series: [{ name: 'Score', data: seriesData }],
        chart: { type: 'bar', height: 350, fontFamily: 'Inter', background: 'transparent', toolbar: { show: false } },
        theme: { mode: 'dark' },
        plotOptions: { bar: { borderRadius: 6, distributed: true, columnWidth: '50%' } },
        colors: ['#333', '#333', '#333', '#333', '#333', '#ffffff'], 
        dataLabels: { enabled: false },
        xaxis: { categories: categories, labels: { style: { colors: '#a1a1aa' } }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { max: 100, labels: { style: { colors: '#a1a1aa' } } },
        grid: { borderColor: '#333', strokeDashArray: 4 },
        legend: { show: false },
        tooltip: { theme: 'dark', y: { formatter: (val) => val + "%" } }
    };

    chartInstance = new ApexCharts(document.querySelector("#chart-body"), options);
    chartInstance.render();
}

function closeChart(){
    document.getElementById('chart-model').classList.add('hidden');
}

// --- ABOUT MODAL FUNCTIONS ---
function openAbout() {
    document.getElementById('about-modal').classList.remove('hidden');
}

function closeAbout() {
    document.getElementById('about-modal').classList.add('hidden');
}
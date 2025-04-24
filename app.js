document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const employeeTypes = document.querySelectorAll('.employee-type');
    const employeeSelector = document.querySelector('.employee-selector');
    const chatContainer = document.getElementById('chatContainer');
    const chatBox = document.getElementById('chatBox');
    const userMessageInput = document.getElementById('userMessage');
    const sendButton = document.getElementById('sendButton');
    const resetButton = document.getElementById('resetButton');

    // Chat state
    let selectedEmployeeType = null;
    let conversationStage = 0;
    let conversationHistory = [];

    // Employee types data
    const employeeData = {
        type1: {
            name: "피해자 코스프레형",
            description: "실수나 문제가 생겨도 늘 남 탓을 하며, 사장에게 감정적으로 의존하거나 방어적 태도를 보임",
            firstMessage: "사장님, 저 정말 억울해요. 제가 프로젝트 마감을 못 맞춘 건 팀원들이 자료를 늦게 줘서 그런 건데, 다들 저만 탓하고 있어요. 항상 저만 희생하는 것 같아요."
        },
        type2: {
            name: "뒷담화 유포형",
            description: "동료나 사장의 말과 행동을 왜곡해 퍼뜨리며 내부 갈등을 조장함",
            firstMessage: "사장님, 솔직히 말씀드리자면... 김 과장님이 사장님을 뒤에서 너무 험하게 얘기하시더라고요. 저는 말리려고 했는데, 다른 직원들도 다 동조하고... 사장님이 좀 알고 계셨으면 해서 말씀드려요."
        },
        type3: {
            name: "매사 핑계형",
            description: "사장의 말에 표면적으로는 따르지만 실제로는 무시하거나 핑계를 댐",
            firstMessage: "네, 사장님. 지난번에 지시하신 보고서 작성 건은 알겠습니다만... 사실 저희 부서 업무가 너무 많아서요. 그리고 이런 보고서는 김 대리가 더 잘 할 것 같은데... 그래도 시간 내서 해보겠습니다."
        }
    };

    // Leadership response templates
    const responseTemplates = [
        // 1. 공감 표현 멘트
        [
            "그런 상황이라면 그렇게 느낄 수 있겠네요. 충분히 이해해요.",
            "말해줘서 고마워요. 이런 이야기 하기 쉽지 않았을 텐데.",
            "그 상황에서는 그렇게 느낄 수 있다고 생각해요. 나라도 그랬을 것 같아요."
        ],
        // 2. 감정 정리 멘트
        [
            "지금은 좀 답답하거나 억울한 마음이 크겠네요.",
            "이야기를 들으니 어떤 점이 제일 힘들었는지 알 것 같아요.",
            "그런 상황에서 많이 속상했겠네요. 감정이 충분히 이해돼요."
        ],
        // 3. 해결 의지 멘트
        [
            "혹시 내가 도울 수 있는 부분이 있을까요?",
            "이 문제는 그냥 넘기지 않을게요. 같이 방법을 찾아보자.",
            "어떻게 하면 이 상황이 나아질 수 있을지 함께 생각해봅시다."
        ],
        // 4. 균형과 기준 잡기 멘트
        [
            "당신의 입장도 충분히 이해되지만, 다른 사람 입장도 한번 같이 생각해보자.",
            "이 일이 반복되지 않게, 우리 같이 기준을 한번 만들어볼까?",
            "모두에게 공정한 해결책을 찾기 위해 다양한 관점에서 바라볼 필요가 있어요."
        ],
        // 5. 마무리 격려 멘트
        [
            "이번 일 잘 얘기해줘서 앞으로 더 좋은 방향으로 갈 수 있을 것 같아.",
            "언제든 얘기해도 괜찮다는 거, 잊지 말아요.",
            "함께 문제를 해결해나갈 수 있어서 다행이에요. 앞으로도 솔직하게 대화해요."
        ]
    ];

    // Employee response templates
    const employeeResponseTemplates = {
        type1: [
            "사장님만이라도 저를 이해해주세요... 다른 사람들은 항상 저를 오해해요.",
            "그래도 이건 제 잘못이 아니잖아요... 왜 제가 책임을 져야 하는지 모르겠어요.",
            "네... 하지만 이번에도 제가 어떻게 할 수 있는 상황이 아니었어요.",
            "말씀은 이해하는데... 그래도 너무 억울해요.",
            "사장님 말씀대로 해볼게요. 그래도 다른 사람들의 태도도 바뀌어야 할 것 같아요."
        ],
        type2: [
            "저는 팀을 위해서 말씀드리는 거예요. 사장님이 모르시면 분위기가 더 나빠질 것 같아서요.",
            "물론 저도 그런 말 믿지 않았어요. 하지만 다른 사람들이 많이 동의하더라고요.",
            "사실 이것 말고도 더 있는데... 말씀드려야 할까요?",
            "네, 알겠습니다. 하지만 이런 말이 또 나오면 어떻게 해야 할지...",
            "사장님 말씀이 맞아요. 제가 앞으로는 더 조심할게요."
        ],
        type3: [
            "네, 해보겠습니다만... 사실 지금 진행 중인 다른 업무도 많아서요.",
            "알겠습니다. 그런데 마감일을 좀 연장해 주실 수 있을까요?",
            "시도는 해보겠지만, 이런 유형의 업무는 처음이라 잘 될지 모르겠네요.",
            "네... 최선을 다해보겠습니다만, 결과물이 기대에 못 미칠 수도 있을 것 같아요.",
            "알겠습니다. 말씀하신 대로 진행해보겠습니다."
        ]
    };

    // Initialize chat
    function startChat(employeeTypeId) {
        selectedEmployeeType = employeeTypeId;
        employeeSelector.style.display = 'none';
        chatContainer.style.display = 'block';
        conversationStage = 0;
        conversationHistory = [];

        // Display first message from employee
        const firstMessage = employeeData[employeeTypeId].firstMessage;
        addMessage(firstMessage, 'employee');
    }

    // Add message to chat
    function addMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender + '-message');
        messageElement.textContent = message;

        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;

        // Store in conversation history
        conversationHistory.push({
            sender: sender,
            message: message
        });
    }

    // Get boss response based on conversation stage
    function getBossResponse() {
        if (conversationStage < responseTemplates.length) {
            // Get random response from the current stage's templates
            const responses = responseTemplates[conversationStage];
            const randomIndex = Math.floor(Math.random() * responses.length);
            return responses[randomIndex];
        }
        return "이제 대화를 마무리할 시간인 것 같네요. 좋은 대화 나눠서 고맙습니다.";
    }

    // Get employee response based on type and stage
    function getEmployeeResponse() {
        if (conversationStage < employeeResponseTemplates[selectedEmployeeType].length) {
            return employeeResponseTemplates[selectedEmployeeType][conversationStage];
        }
        return "네, 사장님. 이해했습니다.";
    }

    // Handle user message submission
    function handleUserMessage() {
        const message = userMessageInput.value.trim();
        if (message === '') return;

        // Add user message to chat
        addMessage(message, 'user');
        userMessageInput.value = '';

        // Get employee response after a short delay
        setTimeout(() => {
            const employeeResponse = getEmployeeResponse();
            addMessage(employeeResponse, 'employee');
            
            // Move to next conversation stage
            conversationStage++;
        }, 1000);
    }

    // Reset chat
    function resetChat() {
        chatContainer.style.display = 'none';
        employeeSelector.style.display = 'block';
        chatBox.innerHTML = '';
        selectedEmployeeType = null;
        conversationStage = 0;
        conversationHistory = [];
    }

    // Event listeners
    employeeTypes.forEach(button => {
        button.addEventListener('click', () => {
            startChat(button.id);
        });
    });

    sendButton.addEventListener('click', handleUserMessage);
    userMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserMessage();
        }
    });

    resetButton.addEventListener('click', resetChat);
}); 
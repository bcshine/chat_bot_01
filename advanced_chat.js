document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const employeeTypes = document.querySelectorAll('.employee-type');
    const employeeSelector = document.querySelector('.employee-selector');
    const chatContainer = document.getElementById('chatContainer');
    const chatBox = document.getElementById('chatBox');
    const userMessageInput = document.getElementById('userMessage');
    const sendButton = document.getElementById('sendButton');
    const resetButton = document.getElementById('resetButton');
    const useAICheckbox = document.getElementById('useAI');
    const modelSelector = document.getElementById('modelSelector');
    const apiUrlInput = document.getElementById('apiUrlInput');
    const saveApiSettingsButton = document.getElementById('saveApiSettings');
    const apiSettingsContainer = document.getElementById('apiSettingsContainer');

    // API Settings handling
    let OLLAMA_API_URL = localStorage.getItem('ollama_api_url') || 'http://localhost:11434/api/chat';
    let SELECTED_MODEL = localStorage.getItem('ollama_model') || 'llama3';
    
    // If we have saved API settings, hide the input and update the selector
    if (OLLAMA_API_URL !== 'http://localhost:11434/api/chat') {
        apiSettingsContainer.style.display = 'none';
    }
    
    if (SELECTED_MODEL && modelSelector) {
        modelSelector.value = SELECTED_MODEL;
    }

    // Save API settings to local storage
    saveApiSettingsButton.addEventListener('click', () => {
        const apiUrl = apiUrlInput.value.trim();
        const model = modelSelector.value;
        
        if (apiUrl) {
            OLLAMA_API_URL = apiUrl;
            localStorage.setItem('ollama_api_url', apiUrl);
        }
        
        if (model) {
            SELECTED_MODEL = model;
            localStorage.setItem('ollama_model', model);
        }
        
        apiSettingsContainer.style.display = 'none';
    });

    // Toggle API settings input visibility based on checkbox
    useAICheckbox.addEventListener('change', () => {
        if (useAICheckbox.checked) {
            apiSettingsContainer.style.display = 'flex';
        } else {
            apiSettingsContainer.style.display = 'none';
        }
    });

    // Chat state
    let selectedEmployeeType = null;
    let conversationStage = 0;
    let conversationHistory = [];

    // Employee types data
    const employeeData = {
        type1: {
            name: "피해자 코스프레형",
            description: "실수나 문제가 생겨도 늘 남 탓을 하며, 사장에게 감정적으로 의존하거나 방어적 태도를 보임",
            firstMessage: "사장님, 저 정말 억울해요. 제가 프로젝트 마감을 못 맞춘 건 팀원들이 자료를 늦게 줘서 그런 건데, 다들 저만 탓하고 있어요. 항상 저만 희생하는 것 같아요.",
            persona: "당신은 '피해자 코스프레형' 직원입니다. 항상 억울하고 자신은 문제가 없다고 생각합니다. 실수가 생겨도 남 탓을 하고, 사장에게 감정적으로 의존하거나 방어적인 태도를 보입니다. 자신이 조직의 희생양이라고 생각하고, 모든 문제에서 자신은 억울하다고 주장합니다."
        },
        type2: {
            name: "뒷담화 유포형",
            description: "동료나 사장의 말과 행동을 왜곡해 퍼뜨리며 내부 갈등을 조장함",
            firstMessage: "사장님, 솔직히 말씀드리자면... 김 과장님이 사장님을 뒤에서 너무 험하게 얘기하시더라고요. 저는 말리려고 했는데, 다른 직원들도 다 동조하고... 사장님이 좀 알고 계셨으면 해서 말씀드려요.",
            persona: "당신은 '뒷담화 유포형' 직원입니다. 동료나 사장의 말과 행동을 왜곡해 퍼뜨리며 내부 갈등을 조장합니다. 마치 조직의 문제를 걱정하는 것처럼 행동하지만, 실제로는 갈등을 즐기고 분위기를 해치는 경향이 있습니다. 사람들 사이의 불화를 조성하고 정보를 왜곡해서 전달합니다."
        },
        type3: {
            name: "매사 핑계형",
            description: "사장의 말에 표면적으로는 따르지만 실제로는 무시하거나 핑계를 댐",
            firstMessage: "네, 사장님. 지난번에 지시하신 보고서 작성 건은 알겠습니다만... 사실 저희 부서 업무가 너무 많아서요. 그리고 이런 보고서는 김 대리가 더 잘 할 것 같은데... 그래도 시간 내서 해보겠습니다.",
            persona: "당신은 '매사 핑계형' 직원입니다. 사장의 지시에 표면적으로는 '네' 라고 말하지만 실제로는 수많은 핑계를 대며 실행하지 않으려 합니다. 항상 '알겠습니다만...'이라고 말하며 조건을 달거나 이유를 만들어 책임을 회피하려 합니다. 늘 자신의 업무 부담이나 능력 부족, 다른 사람이 더 적합하다는 등의 핑계를 댑니다."
        }
    };

    // Leadership conversation stages and guidelines
    const leadershipGuidelines = [
        // 1. 공감 표현 단계
        "직원의 감정에 먼저 공감하고, 이해한다는 표현을 해주세요. '그럴 수 있겠다. 나라도 그랬을 것 같아.' 또는 '말해줘서 고마워요. 이런 이야기 하기 쉽지 않았을 텐데.' 같은 표현이 효과적입니다.",
        
        // 2. 감정 정리 단계
        "직원의 감정을 정리해 주세요. '지금은 좀 답답하거나 억울한 마음이 크겠네요.' 또는 '이야기를 들으니 어떤 점이 제일 힘들었는지 알 것 같아요.' 같은 표현을 사용하세요.",
        
        // 3. 해결 의지 표현 단계
        "해결 의지를 보여주세요. '혹시 내가 도울 수 있는 부분이 있을까요?' 또는 '이 문제는 그냥 넘기지 않을게요. 같이 방법을 찾아보자.' 같은 표현을 사용하세요.",
        
        // 4. 균형과 기준 잡기 단계
        "균형과 기준을 잡아주세요. '당신의 입장도 충분히 이해되지만, 다른 사람 입장도 한번 같이 생각해보자.' 또는 '이 일이 반복되지 않게, 우리 같이 기준을 한번 만들어볼까?' 같은 표현을 사용하세요.",
        
        // 5. 마무리 격려 단계
        "마무리에서 격려와 신뢰를 전하세요. '이번 일 잘 얘기해줘서 앞으로 더 좋은 방향으로 갈 수 있을 것 같아.' 또는 '언제든 얘기해도 괜찮다는 거, 잊지 말아요.' 같은 표현을 사용하세요."
    ];

    // Initialize chat
    function startChat(employeeTypeId) {
        selectedEmployeeType = employeeTypeId;
        employeeSelector.style.display = 'none';
        chatContainer.style.display = 'block';
        conversationStage = 0;
        conversationHistory = [];

        // Check if we need to show API settings input
        if (useAICheckbox.checked) {
            apiSettingsContainer.style.display = 'flex';
        }

        // Display first message from employee
        const firstMessage = employeeData[employeeTypeId].firstMessage;
        addMessage(firstMessage, 'employee');
        
        // Show first leadership guidance
        showLeadershipGuidance();
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

    // Show leadership guidance
    function showLeadershipGuidance() {
        const guidance = getLeadershipGuidance();
        
        // Create a guidance element
        const guidanceElement = document.createElement('div');
        guidanceElement.classList.add('leadership-guidance');
        guidanceElement.innerHTML = `<strong>리더십 가이드 (${conversationStage + 1}/5):</strong> ${guidance}`;
        
        // Only add if not already present
        const existingGuidance = document.querySelector('.leadership-guidance');
        if (existingGuidance) {
            existingGuidance.remove();
        }
        chatBox.appendChild(guidanceElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Get employee response using Ollama API
    async function getEmployeeResponseFromOllama(userMessage) {
        try {
            const employeePersona = employeeData[selectedEmployeeType].persona;
            
            // Format conversation history for Ollama
            const messages = [];
            
            // Add system message with persona
            messages.push({
                role: "system",
                content: `${employeePersona} 다음 대화의 맥락을 보고 직원으로서 짧게 한 문단 정도로 응답하세요. 응답은 직원의 성격과 일관되게 해주세요.`
            });
            
            // Add conversation history
            conversationHistory.forEach(msg => {
                const role = msg.sender === 'user' ? 'user' : 'assistant';
                messages.push({
                    role: role,
                    content: msg.message
                });
            });
            
            // Add the latest user message
            // We don't add it to history yet, as it's already added by handleUserMessage
            
            const response = await fetch(OLLAMA_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: SELECTED_MODEL,
                    messages: messages,
                    stream: false
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || "Ollama API 오류");
            }
            
            return data.message.content.trim();
        } catch (error) {
            console.error('Error getting response from Ollama:', error);
            alert(`Ollama API 오류: ${error.message}. 미리 준비된 응답을 사용합니다.`);
            return getFallbackEmployeeResponse();
        }
    }

    // Fallback employee response if API fails
    function getFallbackEmployeeResponse() {
        const fallbackResponses = {
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

        if (conversationStage < fallbackResponses[selectedEmployeeType].length) {
            return fallbackResponses[selectedEmployeeType][conversationStage];
        }
        return "네, 사장님. 이해했습니다.";
    }

    // Check if Ollama is running
    async function checkOllamaStatus() {
        try {
            const response = await fetch(OLLAMA_API_URL.replace('/chat', '/list'), {
                method: 'GET'
            });
            
            if (!response.ok) {
                throw new Error("Ollama 서버에 연결할 수 없습니다.");
            }
            
            return true;
        } catch (error) {
            console.error('Ollama 연결 실패:', error);
            alert(`Ollama 서버에 연결할 수 없습니다. 로컬에 Ollama가 설치되어 있고 실행 중인지 확인하세요.`);
            return false;
        }
    }

    // Get leadership guidance based on conversation stage
    function getLeadershipGuidance() {
        if (conversationStage < leadershipGuidelines.length) {
            return leadershipGuidelines[conversationStage];
        }
        return "대화를 마무리하고 마지막 격려와 지지를 표현해주세요.";
    }

    // Handle user message submission
    async function handleUserMessage() {
        const message = userMessageInput.value.trim();
        if (message === '') return;

        // Add user message to chat
        addMessage(message, 'user');
        userMessageInput.value = '';
        
        // Show "typing" indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'employee-message', 'typing-indicator');
        typingIndicator.textContent = "직원이 입력 중...";
        chatBox.appendChild(typingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            let employeeResponse;
            
            // Use Ollama or fallback based on checkbox
            if (useAICheckbox.checked) {
                const ollamaRunning = await checkOllamaStatus();
                if (ollamaRunning) {
                    employeeResponse = await getEmployeeResponseFromOllama(message);
                } else {
                    employeeResponse = getFallbackEmployeeResponse();
                }
            } else {
                employeeResponse = getFallbackEmployeeResponse();
                // Add a small delay to simulate thinking
                await new Promise(resolve => setTimeout(resolve, 800));
            }
            
            // Remove typing indicator
            chatBox.removeChild(typingIndicator);
            
            // Add employee response
            addMessage(employeeResponse, 'employee');
            
            // Update leadership guidance
            conversationStage++;
            showLeadershipGuidance();
            
        } catch (error) {
            // Remove typing indicator in case of error
            chatBox.removeChild(typingIndicator);
            
            // Use fallback response
            const fallbackResponse = getFallbackEmployeeResponse();
            addMessage(fallbackResponse, 'employee');
            
            // Move to next conversation stage
            conversationStage++;
            showLeadershipGuidance();
        }
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
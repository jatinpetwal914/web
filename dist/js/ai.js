document.addEventListener('DOMContentLoaded', () => {
    const aiBtn = document.getElementById('ai-btn');
    
    if (aiBtn) {
        aiBtn.addEventListener('click', () => {
            // Redirect to the AI Assistant page
            window.location.href = 'ai.html';
        });
    }
});

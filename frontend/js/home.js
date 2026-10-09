
const Home = (() => {
  let container = document.querySelector("#your-next-step");

 const pages = {
  coursebook: "./coursebook.html",
  flashcards: "./flashcards.html",
  speaking: "./speaking.html",
  journal: "./writing-journal.html",
  feedback: "./writing-journal.html",
  review: "./flashcards.html"
  };

  const steps = {
    coursebook: {
      number: 1,
      title: "Continue with your coursebook",
      description: "Learn one section today. Small steps count.",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5z"/><path d="M5 4.5v17M9 6h7M9 9h7"/></svg>',
      button: "Open coursebook",
      link: pages.coursebook
    },

    flashcards: {
      number: 2,
      title: "Time for your flashcards",
      description: "Practice the new vocabulary from your coursebook.",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 8h8M8 12h5M8 16h3"/><path d="M3 7v12a2 2 0 0 0 2 2"/></svg>',
      button: "Start flashcards",
      link: pages.flashcards
    },

    practice: {
      number: 3,
      title: "Choose your practice",
      description: "Use what you learned. Speak or write about it.",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m4 16.5-.8 4.3 4.3-.8L19.8 7.7a2.1 2.1 0 0 0-3-3z"/><path d="m14.8 6.7 3 3M4 21h16"/></svg>',
    },

    feedback: {
      number: 4,
      title: "Get AI feedback",
      description: "Review your writing and connect it to your coursebook.",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
      button: "Review my writing",
      link: pages.feedback
    },

    review: {
      number: 5,
      title: "Spaced review",
      description: "Review due flashcards and gaps identified by AI.",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 1-2-5l3 5"/><path d="M12 8v4l2.5 1.5"/></svg>',
      button: "Start review",
      link: pages.review
    }
  };

  // Progresso inicial, usado enquanto os dados são carregados.
  let progress = {
    step: "coursebook",
    practiceChoice: null
  };

  let isSaving = false;

  // Carrega o progresso salvo no Supabase.
  async function loadLearningProgress() {
    const supabase = getSupabaseClient();
    const userId = await getCurrentUserId();

    if (!supabase || !userId) {
      throw new Error(
        "Não foi possível conectar ao Supabase ou identificar o usuário."
      );
    }

    const { data, error } = await supabase
      .from("learning_progress")
      .select("current_step, practice_choice")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    // Se o usuário ainda não tem progresso, cria o registro inicial.
    if (!data) {
      const { data: created, error: insertError } = await supabase
        .from("learning_progress")
        .insert({
          user_id: userId,
          current_step: "coursebook",
          practice_choice: null
        })
        .select("current_step, practice_choice")
        .single();

      if (insertError) throw insertError;

      return {
        step: created.current_step,
        practiceChoice: created.practice_choice
      };
    }

    return {
      step: steps[data.current_step]
        ? data.current_step
        : "coursebook",
      practiceChoice: data.practice_choice
    };
  }

  // Salva o progresso do usuário no Supabase.
  async function saveLearningProgress(step, practiceChoice = null) {
    const supabase = getSupabaseClient();
    const userId = await getCurrentUserId();

    if (!supabase || !userId) {
      throw new Error("Usuário não autenticado.");
    }

    const { error } = await supabase
      .from("learning_progress")
      .upsert(
        {
          user_id: userId,
          current_step: step,
          practice_choice: practiceChoice,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: "user_id"
        }
      );

    if (error) throw error;
  }

  // Altera o passo atual e salva a alteração.
  async function setProgress(step, practiceChoice = null) {
    if (!steps[step]) {
      console.error("Etapa de aprendizagem desconhecida:", step);
      return false;
    }

    if (isSaving) return false;

    isSaving = true;

    try {
      await saveLearningProgress(step, practiceChoice);

      progress = {
        step,
        practiceChoice
      };

      render();
      return true;
    } catch (error) {
      console.error("Erro ao salvar o progresso:", error);
      showMessage(
        "Não foi possível salvar seu progresso. Verifique sua conexão e tente novamente."
      );
      return false;
    } finally {
      isSaving = false;
    }
  }

  function showMessage(message) {
    let messageElement = document.querySelector("#home-progress-message");

    if (!messageElement && container) {
      messageElement = document.createElement("p");
      messageElement.id = "home-progress-message";
      messageElement.setAttribute("role", "status");
      messageElement.style.marginTop = "12px";
      messageElement.style.color = "var(--text-color, #b45309)";
      container.appendChild(messageElement);
    }

    if (messageElement) {
      messageElement.textContent = message;
    }
  }

  function renderPracticeChoices() {
    return `
      <div class="next-step-actions">
        <a
          class="next-step-button"
          href="${pages.speaking}"
          data-practice="speaking"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>
          Speaking
        </a>

        <a
          class="next-step-button"
          href="${pages.journal}"
          data-practice="journal"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m4 16.5-.8 4.3 4.3-.8L19.8 7.7a2.1 2.1 0 0 0-3-3z"/><path d="m14.8 6.7 3 3M4 21h16"/></svg>
          Writing Journal
        </a>
      </div>
    `;
  }

  function renderCard() {
    const step = steps[progress.step];

    const actionContent =
      progress.step === "practice"
        ? renderPracticeChoices()
        : `
          <div class="next-step-actions">
            <a
              class="next-step-button"
              href="${step.link}"
              data-action="${progress.step}"
            >
              ${step.button} →
            </a>
          </div>
        `;

    return `
      <article class="next-step-card">
        <p class="next-step-label">
          STEP ${step.number} OF 5 · YOUR LEARNING PATH
        </p>

        <div class="next-step-heading">
          <span class="next-step-icon" aria-hidden="true">
            ${step.icon}
          </span>

          <div>
            <h2>${step.title}</h2>
            <p>${step.description}</p>
          </div>
        </div>

        ${actionContent}

      </article>
    `;
  }

  // Trata os cliques nos links do cartão.
  async function handleClick(event) {
    const practiceLink = event.target.closest("[data-practice]");
    const actionLink = event.target.closest("[data-action]");

    // Ao escolher Speaking ou Journal, salva primeiro e só depois navega.
    if (practiceLink) {
      event.preventDefault();

      if (isSaving) return;

      const choice = practiceLink.dataset.practice;
      const destination = practiceLink.href;

      const saved = await setProgress("practice", choice);

      if (saved) {
        if (window.navigateAppPage) window.navigateAppPage(destination);
        else window.location.href = destination;
      }

      return;
    }

    if (!actionLink) return;

    // Guarda a atividade atual para uso por outras páginas, se necessário.
    try {
      sessionStorage.setItem(
        "currentLearningActivity",
        actionLink.dataset.action
      );
    } catch (error) {
      console.warn("Não foi possível salvar a atividade:", error);
    }
  }

  // Funções para chamar quando cada atividade for concluída.
  async function completeCoursebook() {
    return setProgress("flashcards");
  }

  async function completeFlashcards() {
    return setProgress("practice", null);
  }

  async function completeSpeaking() {
    return setProgress("review", "speaking");
  }

  async function completeJournal() {
    return setProgress("feedback", "journal");
  }

  async function completeFeedback() {
    return setProgress("review", "journal");
  }

  async function completeReview() {
    return setProgress("coursebook", null);
  }

  function render() {
    container = document.querySelector("#your-next-step");
    if (!container) {
      console.warn(
        'O elemento "#your-next-step" não foi encontrado.'
      );
      return;
    }

    container.innerHTML = renderCard();
  }

  // Inicializa o cartão buscando o progresso salvo na conta.
  async function init() {
    container = document.querySelector("#your-next-step");
    if (!container) {
      console.warn(
        'O elemento "#your-next-step" não foi encontrado.'
      );
      return;
    }

    const pomodoroContainer = document.querySelector("#home-pomodoro-content");
    if (pomodoroContainer && typeof renderizarPomodoro === "function") {
      renderizarPomodoro(pomodoroContainer);
    }

    if (container.dataset.homeInitialized !== "true") {
      container.addEventListener("click", handleClick);
      container.dataset.homeInitialized = "true";
    }

    // Evita mostrar o cartão inicial antes de carregar o progresso.
    container.innerHTML = `
      <p role="status">Loading your learning progress...</p>
    `;

    try {
      progress = await loadLearningProgress();
      render();
    } catch (error) {
      console.error("Erro ao carregar o progresso:", error);

      container.innerHTML = `
        <article class="next-step-card">
          <h2>Could not load your progress</h2>
          <p>
            Check your connection and make sure you are logged in.
          </p>
          <button type="button" id="retry-home-progress">
            Try again
          </button>
        </article>
      `;

      container
        .querySelector("#retry-home-progress")
        ?.addEventListener("click", init);
    }
  }

  return {
    init,
    render,
    setProgress,
    loadLearningProgress,
    saveLearningProgress,
    completeCoursebook,
    completeFlashcards,
    completeSpeaking,
    completeJournal,
    completeFeedback,
    completeReview
  };
})();

window.Home = Home;

document.addEventListener("DOMContentLoaded", Home.init);

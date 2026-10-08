
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
      icon: "📘",
      button: "Open coursebook",
      link: pages.coursebook
    },

    flashcards: {
      number: 2,
      title: "Time for your flashcards",
      description: "Practice the new vocabulary from your coursebook.",
      icon: "🗂️",
      button: "Start flashcards",
      link: pages.flashcards
    },

    practice: {
      number: 3,
      title: "Choose your practice",
      description: "Use what you learned. Speak or write about it.",
      icon: "✍️"
    },

    feedback: {
      number: 4,
      title: "Get AI feedback",
      description: "Review your writing and connect it to your coursebook.",
      icon: "✨",
      button: "Review my writing",
      link: pages.feedback
    },

    review: {
      number: 5,
      title: "Spaced review",
      description: "Review due flashcards and gaps identified by AI.",
      icon: "🔄",
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
          🎙️ Speaking
        </a>

        <a
          class="next-step-button"
          href="${pages.journal}"
          data-practice="journal"
        >
          ✍️ Writing Journal
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
        window.location.href = destination;
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

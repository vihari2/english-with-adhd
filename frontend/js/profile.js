/** Profile, avatar, and appearance settings. */

function aplicarBackgroundSalvo() {
    const tipoSalvo = appStorage.getItem('bg_type');
    const valorSalvo = appStorage.getItem('bg_value');

    if (tipoSalvo === 'image' && valorSalvo) {
        document.body.style.backgroundImage = `url(${valorSalvo})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
    } else {
        // Se for cor ou nada salvo, reseta para a cor padrão do body (a que vc usa na imagem 3)
        document.body.style.backgroundColor = '#F0F2F5';
        document.body.style.backgroundImage = 'none';
    }
}

// --- Interatividade ---
const btnConfig = document.getElementById('btn-config-bg');

if (btnConfig) {
    btnConfig.addEventListener('click', function () {
        const modal = document.getElementById('modal-config-bg');
        if (modal) {
            modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
        }
    });
}

function closeConfigModal() {
    document.getElementById('modal-config-bg').style.display = 'none';
}

async function toggleBgOption(option) {
    const uploadContainer = document.getElementById('upload-container');

    if (option === 'image') {
        uploadContainer.style.display = 'block';
        return;
    }

    uploadContainer.style.display = 'none';

    const userId = await getCurrentUserId();

    if (!userId || !isSupabaseConfigured()) {
        alert("Você precisa estar logada para salvar essa alteração.");
        return;
    }

    const client = getSupabaseClient();

    // Buscar o caminho da imagem anterior
    const { data: profile, error: fetchError } = await client
        .from('profiles')
        .select('bg_url')
        .eq('user_id', userId)
        .single();

    if (fetchError) {
        console.error(fetchError);
        alert("Não foi possível carregar seu perfil.");
        return;
    }

    // Remover imagem anterior do Storage, se existir
    if (profile?.bg_url) {
        const { error: deleteError } = await client.storage
            .from('backgrounds')
            .remove([profile.bg_url]);

        if (deleteError) {
            console.error(deleteError);
        }
    }

    // Salvar a preferência pelo fundo padrão
    const { error: updateError } = await client
        .from('profiles')
        .update({
            bg_type: 'color',
            bg_url: null
        })
        .eq('user_id', userId);

    if (updateError) {
        console.error(updateError);
        alert("Não foi possível salvar o fundo padrão.");
        return;
    }

    // Aplicar o fundo padrão
    document.body.style.backgroundColor = '#F0F2F5';
    document.body.style.backgroundImage = 'none';

    alert("Fundo padrão salvo com sucesso!");
}

// --- Mágica do Upload (Base64) ---
async function handleImageUpload(input) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];

    // Verificar tamanho máximo de 5 MB
    if (file.size > 5 * 1024 * 1024) {
        alert("A imagem é muito grande. Máximo 5MB.");
        input.value = "";
        return;
    }

    const userId = await getCurrentUserId();

    if (!userId || !isSupabaseConfigured()) {
        alert("Você precisa estar logada para salvar a imagem.");
        return;
    }

    const client = getSupabaseClient();

    try {
        // Criar um nome único para o arquivo
        const extension = file.name.split('.').pop();
        const filePath = `${userId}/background-${Date.now()}.${extension}`;

        // Enviar imagem para o Supabase Storage
        const { error: uploadError } = await client.storage
            .from('backgrounds')
            .upload(filePath, file, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error(uploadError);
            alert("Erro ao enviar a imagem.");
            return;
        }

        // Salvar o caminho da imagem no perfil do usuário
        const { error: profileError } = await client
            .from('profiles')
            .update({
                bg_type: 'image',
                bg_url: filePath
            })
            .eq('user_id', userId);

        if (profileError) {
            console.error(profileError);
            alert("A imagem foi enviada, mas não foi possível salvar no perfil.");
            return;
        }

        // Gerar URL temporária para exibir a imagem
        const { data: signedData, error: signedError } =
            await client.storage
                .from('backgrounds')
                .createSignedUrl(filePath, 3600);

        if (signedError) {
            console.error(signedError);
            alert("Imagem salva, mas não foi possível exibi-la.");
            return;
        }

        // Aplicar imagem de fundo
        document.body.style.backgroundImage =
            `url("${signedData.signedUrl}")`;

        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';

        alert("Imagem de fundo salva com sucesso!");

    } catch (error) {
        console.error(error);
        alert("Ocorreu um erro ao salvar a imagem.");
    }
}

async function saveNameToSupabase(nome) {
    const userId = await getCurrentUserId();
    if (!userId || !isSupabaseConfigured()) return;

    const client = getSupabaseClient();
    const { error } = await client
        .from('profiles')
        .upsert({ user_id: userId, nome }, { onConflict: 'user_id' });

    if (error) throw error;
}

async function saveAvatarToSupabase(file) {
    const userId = await getCurrentUserId();
    if (!userId || !isSupabaseConfigured() || !file) throw new Error('Could not identify the signed-in user.');

    const extension = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${extension}`;
    const client = getSupabaseClient();

    const { error: uploadError } = await client.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = client.storage
        .from('avatars')
        .getPublicUrl(fileName);

    const avatarUrl = publicUrlData?.publicUrl;

    if (!avatarUrl) throw new Error('Could not create a public URL for the avatar.');
    const { error } = await client
        .from('profiles')
        .upsert({ user_id: userId, avatar_url: avatarUrl }, { onConflict: 'user_id' });
    if (error) throw error;
    return avatarUrl;
}

function aplicarTemaSalvo() {
    const temaEscuro = appStorage.getItem('temaEscuro') === 'true';
    document.body.classList.toggle('dark-mode', temaEscuro);
    const controleTema = document.getElementById('toggle-tema');
    if (controleTema) controleTema.checked = temaEscuro;
}

function alternarTema() {
    const temaEscuro = !document.body.classList.contains('dark-mode');
    appStorage.setItem('temaEscuro', String(temaEscuro));
    aplicarTemaSalvo();
}

const fotoImg = document.getElementById('foto-img');
const uploadFoto = document.getElementById('upload-foto');

function loadProfileData() {
    const nomeSalvo = appStorage.getItem('nomeUsuario');
    const nomeTxt = document.getElementById('nome-txt');
    if (nomeTxt) {
        nomeTxt.textContent = nomeSalvo || 'Your Name Here';
    }

    const fotoSalva = appStorage.getItem('fotoPerfilCustom');
    if (fotoSalva && fotoImg) {
        fotoImg.src = fotoSalva;
    }

    const gatoSalvo = appStorage.getItem('fotoGatoCustom');
    if (gatoSalvo && imgGato) {
        imgGato.src = gatoSalvo;
    }

    updateAccountSummary();
}

function updateAccountSummary() {
    const name = appStorage.getItem('nomeUsuario') || 'User';
    const avatarUrl = appStorage.getItem('fotoPerfilCustom');
    document.querySelectorAll('.account-summary').forEach((summary) => {
        const nameElement = summary.querySelector('.account-name');
        const avatar = summary.querySelector('.account-avatar');
        const fallback = summary.querySelector('.account-avatar-fallback');
        if (nameElement) nameElement.textContent = name;
        if (avatar && fallback && avatarUrl) {
            avatar.src = avatarUrl;
            avatar.hidden = false;
            fallback.hidden = true;
        } else if (avatar && fallback) {
            avatar.hidden = true;
            fallback.hidden = false;
            fallback.textContent = name.trim().charAt(0).toUpperCase() || 'U';
        }
    });
}

function renderizarPerfil(container) {
    if (!container) return;
    const name = appStorage.getItem('nomeUsuario') || 'User';
    const avatarUrl = appStorage.getItem('fotoPerfilCustom');
    const safeName = escapeProfileHtml(name);
    const safeAvatarUrl = escapeProfileHtml(avatarUrl || '');
    container.innerHTML = `
      <section class="profile-page">
        <h2>Profile settings</h2>
        <p>Update the name and avatar shown in your account.</p>
        <div class="profile-current">
          <img id="profile-avatar-current" class="profile-avatar-current" alt="Current avatar" ${avatarUrl ? `src="${safeAvatarUrl}"` : 'hidden'}>
          <span id="profile-avatar-fallback" class="profile-avatar-fallback" ${avatarUrl ? 'hidden' : ''}>${safeName.trim().charAt(0).toUpperCase() || 'U'}</span>
          <strong>${safeName}</strong>
        </div>
        <label for="profile-name-input">Name</label>
        <input id="profile-name-input" class="profile-name-input" type="text" maxlength="60" autocomplete="name" value="${safeName}">
        <label for="profile-avatar-input">Upload avatar</label>
        <input id="profile-avatar-input" class="profile-avatar-input" type="file" accept="image/*" onchange="previewProfileAvatar(this)">
        <img id="profile-avatar-preview" class="profile-avatar-preview" alt="New avatar preview" hidden>
        <p id="profile-editor-status" class="profile-editor-status" role="status" aria-live="polite"></p>
        <button type="button" id="profile-save-button" class="profile-save-button" onclick="saveAccountProfile()">Save changes</button>
      </section>`;
}

function escapeProfileHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

function previewProfileAvatar(input) {
    const file = input.files?.[0];
    if (!file) return;
    const status = document.getElementById('profile-editor-status');
    if (!file.type.startsWith('image/')) {
        status.textContent = 'Choose an image file.';
        input.value = '';
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        status.textContent = 'The image must be smaller than 5 MB.';
        input.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        const preview = document.getElementById('profile-avatar-preview');
        preview.src = reader.result;
        preview.hidden = false;
        status.textContent = '';
    };
    reader.readAsDataURL(file);
}

async function saveAccountProfile() {
    const name = document.getElementById('profile-name-input').value.trim();
    const file = document.getElementById('profile-avatar-input').files?.[0];
    const status = document.getElementById('profile-editor-status');
    const saveButton = document.getElementById('profile-save-button');
    if (!name) {
        status.textContent = 'Enter your name before saving.';
        return;
    }

    saveButton.disabled = true;
    status.textContent = 'Saving…';
    try {
        if (file) {
            const avatarUrl = isSupabaseConfigured()
                ? await saveAvatarToSupabase(file)
                : await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error('Could not read the image.'));
                    reader.readAsDataURL(file);
                });
            appStorage.setItem('fotoPerfilCustom', avatarUrl);
        }
        if (isSupabaseConfigured()) await saveNameToSupabase(name);
        appStorage.setItem('nomeUsuario', name);
        updateAccountSummary();
        const currentAvatar = document.getElementById('profile-avatar-current');
        const fallback = document.getElementById('profile-avatar-fallback');
        const avatarUrl = appStorage.getItem('fotoPerfilCustom');
        const nameElement = document.querySelector('.profile-current strong');
        if (nameElement) nameElement.textContent = name;
        if (currentAvatar && fallback && avatarUrl) {
            currentAvatar.src = avatarUrl;
            currentAvatar.hidden = false;
            fallback.hidden = true;
        } else if (currentAvatar && fallback) {
            currentAvatar.hidden = true;
            fallback.hidden = false;
            fallback.textContent = name.trim().charAt(0).toUpperCase() || 'U';
        }
        status.textContent = 'Profile saved.';
    } catch (error) {
        console.error('Could not save profile:', error);
        status.textContent = 'Could not save. Check your connection and try again.';
    } finally {
        saveButton.disabled = false;
    }
}

if (fotoImg && uploadFoto) {
    fotoImg.addEventListener('click', () => uploadFoto.click());

    uploadFoto.addEventListener('change', async function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            const dataUrl = event.target.result;
            fotoImg.src = dataUrl;
            appStorage.setItem('fotoPerfilCustom', dataUrl);
        };
        reader.readAsDataURL(file);

        if (isSupabaseConfigured()) {
            await saveAvatarToSupabase(file);
        }
    });
}

// --- Lógica para salvar a foto do gatinho ---
const imgGato = document.getElementById('img-gato');
const uploadGato = document.getElementById('upload-gato');

if (imgGato && uploadGato) {
    imgGato.addEventListener('click', () => uploadGato.click());

    uploadGato.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const dataUrl = event.target.result;
                imgGato.src = dataUrl;
                appStorage.setItem('fotoGatoCustom', dataUrl);
            };
            reader.readAsDataURL(file);
        }
    });
}

function salvarNome() {
    const nomeTag = document.getElementById('nome-txt');
    if (!nomeTag) return;
    const nome = nomeTag.textContent.trim() || 'Your Name Here';
    appStorage.setItem('nomeUsuario', nome);
    if (isSupabaseConfigured()) saveNameToSupabase(nome).catch(console.error);
}

async function loadProfileFromSupabase() {
    const userId = await getCurrentUserId();

    if (!userId || !isSupabaseConfigured()) return;

    const client = getSupabaseClient();

    const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    // Carregar nome do usuário
    const nomeTxt = document.getElementById('nome-txt');

    if (data?.nome) {
        if (nomeTxt) nomeTxt.textContent = data.nome;
        appStorage.setItem('nomeUsuario', data.nome);
    }

    // Carregar foto de perfil
    if (data?.avatar_url) {
        if (fotoImg) fotoImg.src = data.avatar_url;
        appStorage.setItem('fotoPerfilCustom', data.avatar_url);
    }
    updateAccountSummary();

    // Carregar imagem de fundo do Supabase
    if (data?.bg_type === 'image' && data?.bg_url) {

        const { data: signedData, error: signedError } =
            await client.storage
                .from('backgrounds')
                .createSignedUrl(data.bg_url, 3600);

        if (signedError) {
            console.error(
                'Erro ao carregar imagem de fundo:',
                signedError
            );
            return;
        }

        const imageUrl = signedData.signedUrl;

        document.body.style.backgroundImage = `url("${imageUrl}")`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';

    } else {
        document.body.style.backgroundColor = '#F0F2F5';
        document.body.style.backgroundImage = 'none';
    }
}

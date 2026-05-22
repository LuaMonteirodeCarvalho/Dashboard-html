let dailyQuotes = [];
let moodQuotes = {};
let backgroundImages = [];
let moodTracks = {};

async function loadDashboardData() {
    try {
        const response = await fetch('data/dashboard.json');
        const data = await response.json();
        dailyQuotes = data.dailyQuotes;
        moodQuotes = data.moodQuotes;
        backgroundImages = data.backgroundImages;
        moodTracks = data.moodTracks;
        
        updateBackgroundAndDefaultQuote();
    } catch (err) {
        console.error("Erro ao carregar os dados do dashboard:", err);
    }
}

        let currentTrackId = null;
        let isPaused = false;

        function loadSpotifyTrack(mood) {
            const track = moodTracks[mood];
            const embedUrl = `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0&autoplay=1`;
            const iframe = document.getElementById('spotify-iframe');
            const player = document.getElementById('spotify-player');

            currentTrackId = track.id;
            isPaused = false;
            document.getElementById('pause-btn').textContent = '⏸️';

            // Animação de troca
            player.style.opacity = '0';
            setTimeout(() => {
                iframe.src = embedUrl;
                player.style.display = 'block';
                player.style.transition = 'opacity 0.5s ease';
                player.style.opacity = '1';
                document.getElementById('eq-bars').classList.add('playing');
            }, 200);
        }

        function togglePause() {
            const iframe = document.getElementById('spotify-iframe');
            const btn = document.getElementById('pause-btn');
            const bars = document.getElementById('eq-bars');

            if (!currentTrackId) return;

            if (isPaused) {
                const embedUrl = `https://open.spotify.com/embed/track/${currentTrackId}?utm_source=generator&theme=0&autoplay=1`;
                iframe.src = embedUrl;
                btn.textContent = '⏸️';
                bars.classList.add('playing');
                isPaused = false;
            } else {
                iframe.src = '';
                btn.textContent = '▶️';
                bars.classList.remove('playing');
                isPaused = true;
            }
        }

        function changeMood(mood, buttonElement) {
            const buttons = document.querySelectorAll('.mood-buttons button');
            buttons.forEach(btn => btn.classList.remove('active'));
            
            if (buttonElement) buttonElement.classList.add('active');

            const quoteEl = document.getElementById('daily-quote');
            quoteEl.style.opacity = 0;
            setTimeout(() => {
                const quotes = moodQuotes[mood];
                const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                quoteEl.textContent = `"${randomQuote}"`;
                quoteEl.style.opacity = 1;
            }, 300);

            loadSpotifyTrack(mood);
        }

        function updateBackgroundAndDefaultQuote() {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 0);
            const diff = now - start;
            const oneDay = 1000 * 60 * 60 * 24;
            const dayOfYear = Math.floor(diff / oneDay);
            
            const quoteIndex = dayOfYear % dailyQuotes.length;
            document.getElementById('daily-quote').textContent = `"${dailyQuotes[quoteIndex]}"`;

            const imageIndex = dayOfYear % backgroundImages.length;
            document.body.style.backgroundImage = `url('${backgroundImages[imageIndex]}')`;
        }

        let activeUserFirstName = 'Lua';

        function updateDateTime() {
            const now = new Date();
            
            const optionsDate = { day: 'numeric', month: 'long', year: 'numeric' };
            document.getElementById('current-date').textContent = now.toLocaleDateString('pt-BR', optionsDate);
            
            document.getElementById('current-time').textContent = now.toLocaleTimeString('pt-BR');

            const hour = now.getHours();
            let greetingText = 'Boa Noite';
            let emoji = '🌙';
            
            if (hour >= 5 && hour < 12) {
                greetingText = 'Bom Dia';
                emoji = '☀️';
            } else if (hour >= 12 && hour < 18) {
                greetingText = 'Boa Tarde';
                emoji = '☀️';
            }
            
            document.getElementById('greeting').textContent = `${greetingText}, ${activeUserFirstName}! ${emoji}`;
        }

        // ============================================================
        // GOOGLE INTEGRATION (GSI & GAPI)
        // ============================================================
        const CLIENT_ID = '997944017654-89slpubfui09vlg7enbeqt0fd93a0o3v.apps.googleusercontent.com';
        const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile';

        let tokenClient;
        let gapiInited = false;
        let gsiInited = false;

        function gapiLoaded() {
            gapi.load('client', initializeGapiClient);
        }

        async function initializeGapiClient() {
            try {
                await gapi.client.init({});
                await gapi.client.load('gmail', 'v1');
                await gapi.client.load('calendar', 'v3');
                gapiInited = true;
                maybeEnableAuth();
            } catch (err) {
                console.error('Error initializing GAPI:', err);
            }
        }

        function gisLoaded() {
            try {
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: '', 
                });
                gsiInited = true;
                maybeEnableAuth();
            } catch (err) {
                console.error('Error initializing GSI:', err);
            }
        }

        function maybeEnableAuth() {
            if (gapiInited && gsiInited) {
                const savedToken = localStorage.getItem('google_access_token');
                const expiry = localStorage.getItem('google_token_expiry');
                
                if (savedToken && expiry && Date.now() < parseInt(expiry)) {
                    gapi.client.setToken({ access_token: savedToken });
                    handleAuthSuccess(savedToken);
                } else {
                    document.getElementById('google-login-btn').style.display = 'flex';
                }
            } else {
                console.log('maybeEnableAuth called but not fully loaded yet:', { gapiInited, gsiInited });
            }
        }

        function handleAuthClick() {
            if (!tokenClient) {
                alert('Os serviços do Google ainda estão carregando ou foram bloqueados. Tente novamente em instantes.');
                return;
            }
            tokenClient.callback = async (resp) => {
                if (resp.error !== undefined) {
                    console.error('Auth error:', resp);
                    return;
                }
                const token = resp.access_token;
                const expiry = Date.now() + (resp.expires_in * 1000);
                
                localStorage.setItem('google_access_token', token);
                localStorage.setItem('google_token_expiry', expiry);
                
                gapi.client.setToken({ access_token: token });
                await handleAuthSuccess(token);
            };

            tokenClient.requestAccessToken({ prompt: 'consent' });
        }

        async function handleAuthSuccess(token) {
            document.getElementById('google-login-btn').style.display = 'none';
            document.getElementById('user-profile').style.display = 'flex';
            
            await fetchUserProfile(token);
            await refreshGoogleData();
        }

        async function fetchUserProfile(token) {
            try {
                const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resp.ok) {
                    const profile = await resp.json();
                    document.getElementById('user-avatar').src = profile.picture || 'assets/default_avatar.png';
                    document.getElementById('user-name').textContent = profile.given_name || profile.name;
                    activeUserFirstName = profile.given_name || profile.name || 'Lua';
                    updateDateTime();
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
                document.getElementById('user-name').textContent = 'Conectado';
            }
        }

        async function refreshGoogleData() {
            await Promise.all([
                fetchUnreadEmails(),
                fetchTodayMeetings()
            ]);
        }

        async function fetchUnreadEmails() {
            try {
                const response = await gapi.client.gmail.users.threads.list({
                    userId: 'me',
                    q: 'is:unread'
                });
                const count = response.result.threads ? response.result.threads.length : 0;
                document.getElementById('unread-emails-count').textContent = count;
            } catch (err) {
                console.error('Gmail API Error:', err);
                document.getElementById('unread-emails-count').textContent = '--';
            }
        }

        async function fetchTodayMeetings() {
            try {
                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
                const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

                const response = await gapi.client.calendar.events.list({
                    calendarId: 'primary',
                    timeMin: startOfDay,
                    timeMax: endOfDay,
                    singleEvents: true,
                    orderBy: 'startTime'
                });
                
                const events = response.result.items || [];
                const listContainer = document.getElementById('meetings-list');
                listContainer.innerHTML = '';
                
                if (events.length > 0) {
                    events.forEach(event => {
                        const eventEl = document.createElement('div');
                        eventEl.className = 'event-item';
                        
                        const nameEl = document.createElement('span');
                        nameEl.className = 'event-name';
                        nameEl.textContent = event.summary || 'Sem Título';
                        
                        const timeEl = document.createElement('span');
                        timeEl.className = 'event-time';
                        
                        // Format event time (hours and minutes)
                        let timeStr = 'Dia todo';
                        if (event.start && event.start.dateTime) {
                            const dateObj = new Date(event.start.dateTime);
                            timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        }
                        timeEl.textContent = timeStr;
                        
                        eventEl.appendChild(nameEl);
                        eventEl.appendChild(timeEl);
                        listContainer.appendChild(eventEl);
                    });
                } else {
                    listContainer.innerHTML = '<div class="no-events">Sem compromissos</div>';
                }
            } catch (err) {
                console.error('Calendar API Error:', err);
                const listContainer = document.getElementById('meetings-list');
                listContainer.innerHTML = '<div class="no-events" style="color: #ff4500;">Erro ao carregar</div>';
            }
        }


        function handleSignoutClick() {
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_token_expiry');
            
            gapi.client.setToken(null);
            
            document.getElementById('user-profile').style.display = 'none';
            document.getElementById('google-login-btn').style.display = 'flex';
            activeUserFirstName = 'Lua';
            updateDateTime();
            
            document.getElementById('unread-emails-count').textContent = '0';
            const listContainer = document.getElementById('meetings-list');
            if (listContainer) {
                listContainer.innerHTML = '<div class="no-events">Sem compromissos</div>';
            }
        }

        async function fetchWeather() {
            const tempEl = document.getElementById('weather-temp');
            const descEl = document.getElementById('weather-desc');
            const iconEl = document.querySelector('.weather-widget-icon');

            // Default coordinates (São Paulo, Brazil)
            let lat = -23.5505;
            let lon = -46.6333;

            // Weather code to description and emoji map
            const weatherCodes = {
                0: { desc: 'Céu limpo', emoji: '☀️' },
                1: { desc: 'Principalmente limpo', emoji: '🌤️' },
                2: { desc: 'Parcialmente nublado', emoji: '⛅' },
                3: { desc: 'Encoberto', emoji: '☁️' },
                45: { desc: 'Nevoeiro', emoji: '🌫️' },
                48: { desc: 'Nevoeiro com geada', emoji: '🌫️' },
                51: { desc: 'Chuvisco leve', emoji: '🌧️' },
                53: { desc: 'Chuvisco moderado', emoji: '🌧️' },
                55: { desc: 'Chuvisco denso', emoji: '🌧️' },
                61: { desc: 'Chuva fraca', emoji: '🌧️' },
                63: { desc: 'Chuva moderada', emoji: '🌧️' },
                65: { desc: 'Chuva forte', emoji: '🌧️' },
                71: { desc: 'Neve leve', emoji: '❄️' },
                73: { desc: 'Neve moderada', emoji: '❄️' },
                75: { desc: 'Neve forte', emoji: '❄️' },
                77: { desc: 'Grãos de neve', emoji: '❄️' },
                80: { desc: 'Pancadas de chuva leve', emoji: '🌧️' },
                81: { desc: 'Pancadas de chuva moderada', emoji: '🌧️' },
                82: { desc: 'Pancadas de chuva violenta', emoji: '⛈️' },
                95: { desc: 'Trovoada leve ou moderada', emoji: '⛈️' },
                96: { desc: 'Trovoada com granizo leve', emoji: '⛈️' },
                99: { desc: 'Trovoada com granizo forte', emoji: '⛈️' }
            };

            const updateWeatherUI = async (latitude, longitude) => {
                try {
                    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`);
                    if (!response.ok) throw new Error('Network error');
                    const data = await response.json();
                    
                    const temp = Math.round(data.current.temperature_2m);
                    const code = data.current.weather_code;
                    const weatherInfo = weatherCodes[code] || { desc: 'Desconhecido', emoji: '🌡️' };
                    
                    tempEl.textContent = `${temp}°C`;
                    descEl.textContent = weatherInfo.desc;
                    iconEl.textContent = weatherInfo.emoji;
                } catch (err) {
                    console.error('Weather fetch error:', err);
                    tempEl.textContent = '--°C';
                    descEl.textContent = 'Erro ao carregar clima';
                    iconEl.textContent = '⚠️';
                }
            };

            // Try Geolocation API
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        updateWeatherUI(position.coords.latitude, position.coords.longitude);
                    },
                    async (error) => {
                        console.warn('Geolocation blocked or failed, trying IP-based fallback...', error);
                        try {
                            const ipResponse = await fetch('https://ipapi.co/json/');
                            if (ipResponse.ok) {
                                const ipData = await ipResponse.json();
                                if (ipData.latitude && ipData.longitude) {
                                    updateWeatherUI(ipData.latitude, ipData.longitude);
                                    return;
                                }
                            }
                        } catch (ipErr) {
                            console.error('IP Geolocation failed:', ipErr);
                        }
                        updateWeatherUI(lat, lon);
                    },
                    { timeout: 5000 }
                );
            } else {
                updateWeatherUI(lat, lon);
            }
        }

        async function fetchNews() {
            const listContainer = document.getElementById('news-list');
            try {
                const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fg1.globo.com%2Fdynamo%2Frss2.xml');
                if (!response.ok) throw new Error('Erro ao carregar notícias');
                const data = await response.json();
                
                if (data.status === 'ok' && data.items && data.items.length > 0) {
                    listContainer.innerHTML = '';
                    const items = data.items.slice(0, 10);
                    items.forEach(item => {
                        const newsEl = document.createElement('a');
                        newsEl.href = item.link;
                        newsEl.target = '_blank';
                        newsEl.className = 'news-item';
                        
                        let timeStr = '';
                        if (item.pubDate) {
                            const dateObj = new Date(item.pubDate);
                            timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        }
                        
                        newsEl.innerHTML = `
                            <div class="news-item-title">${item.title}</div>
                            <div class="news-item-meta">
                                <span class="news-item-source">CBN / G1</span>
                                <span class="news-item-time">${timeStr}</span>
                            </div>
                        `;
                        listContainer.appendChild(newsEl);
                    });
                } else {
                    listContainer.innerHTML = '<div class="news-loading">Nenhuma notícia encontrada.</div>';
                }
            } catch (err) {
                console.error('Erro ao buscar notícias:', err);
                listContainer.innerHTML = '<div class="news-loading" style="color: #ff4500;">Erro ao carregar notícias.</div>';
            }
        }

        window.addEventListener('load', () => {
            setTimeout(() => {
                if (!gapiInited || !gsiInited) {
                    console.log('Safety fallback activated. Forcing button display check.');
                    const savedToken = localStorage.getItem('google_access_token');
                    if (!savedToken) {
                        document.getElementById('google-login-btn').style.display = 'flex';
                    }
                }
            }, 3000);
        });

        // updateBackgroundAndDefaultQuote() called after fetch
        updateDateTime();
        fetchWeather();
        fetchNews();
        
        setInterval(updateDateTime, 1000);
        setInterval(fetchNews, 15 * 60 * 1000); // Atualiza notícias a cada 15 minutos

loadDashboardData();

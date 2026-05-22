@echo off
echo Iniciando servidor do Dashboard da Lua...
cd /d "C:\Users\Familia\.gemini\antigravity"

:: Mata qualquer servidor antigo na porta 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Inicia o servidor Python em segundo plano
start /min "DashboardServer" python -m http.server 8000

:: Aguarda 2 segundos para o servidor iniciar
timeout /t 2 /nobreak >nul

:: Abre o dashboard no Chrome
start "" "http://localhost:8000/Projeto%%20dashboard.html"

echo Servidor iniciado! Dashboard aberto no navegador.
echo NAO feche esta janela enquanto estiver usando o dashboard.
echo.
echo Pressione qualquer tecla para encerrar o servidor.
pause >nul

:: Encerra o servidor ao fechar
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo Servidor encerrado.

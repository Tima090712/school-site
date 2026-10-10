// ============================================
//   СЕРВЕР ДЛЯ САЙТА ШКОЛЫ №23
//   Node.js + Express + Socket.IO
// ============================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Создаём приложение Express
const app = express();

// Создаём HTTP-сервер на основе Express
const server = http.createServer(app);

// Подключаем Socket.IO к HTTP-серверу
const io = new Server(server, {
    cors: {
        origin: '*', // Разрешаем подключения с любых адресов
        methods: ['GET', 'POST']
    }
});

// ============================================
//   РАЗДАЧА СТАТИЧНЫХ ФАЙЛОВ
// ============================================
// Все файлы из папки public будут доступны по адресу http://localhost:3000/
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
//   ХРАНИЛИЩЕ СООБЩЕНИЙ
// ============================================
// Сообщения хранятся в оперативной памяти.
// При перезапуске сервера они исчезнут.
// Если нужно постоянное хранение — подключи базу данных (MongoDB, SQLite).
const messages = [];
const MAX_MESSAGES = 100; // Храним последние 100 сообщений

// ============================================
//   ОБРАБОТКА ПОДКЛЮЧЕНИЙ SOCKET.IO
// ============================================
io.on('connection', (socket) => {
    console.log('🟢 Подключился игрок. ID:', socket.id);

    // 1. Отправляем новому игроку историю чата
    socket.emit('chatHistory', messages);

    // 2. Принимаем новое сообщение от игрока
    socket.on('sendMessage', (data) => {
        // Проверяем, что сообщение не пустое
        if (!data.text || data.text.trim() === '') return;

        // Формируем объект сообщения
        const msg = {
            text: data.text.trim(),
            author: data.author || 'Аноним',
            role: data.role || 'student',
            time: new Date().toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            timestamp: Date.now()
        };

        // Добавляем в хранилище
        messages.push(msg);

        // Если сообщений больше 100 — удаляем самые старые
        if (messages.length > MAX_MESSAGES) {
            messages.shift();
        }

        console.log(`💬 ${msg.author}: ${msg.text}`);

        // Отправляем сообщение ВСЕМ подключённым игрокам
        io.emit('newMessage', msg);
    });

    // 3. Обработка отключения
    socket.on('disconnect', () => {
        console.log('🔴 Отключился игрок. ID:', socket.id);
    });
});

// ============================================
//   ЗАПУСК СЕРВЕРА
// ============================================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log('============================================');
    console.log('✅ СЕРВЕР ШКОЛЫ №23 ЗАПУЩЕН!');
    console.log(`🌐 Открой в браузере: http://localhost:${PORT}`);
    console.log('============================================');
});
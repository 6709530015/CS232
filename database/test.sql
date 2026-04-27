USE myproject;

INSERT INTO users (email, password_hash, name)
VALUES
('demo@dome.tu.ac.th', '1234', 'Demo User');

INSERT INTO tasks (user_id, title, description, due_date, status, file_url)
VALUES
(1, 'ทำการบ้าน AI', 'อ่าน alpha-beta pruning และสรุปส่งอาจารย์', '2026-05-01 23:59:00', 'pending', NULL),
(1, 'ส่งโปรเจค Cloud', 'เตรียม slide และ demo ระบบแจ้งเตือน deadline', '2026-05-05 18:00:00', 'pending', NULL);

INSERT INTO notifications (user_id, task_id, message, notify_date, is_read, is_sent)
VALUES
(1, 1, 'งาน AI ใกล้ถึง deadline แล้ว!', '2026-04-30 09:00:00', FALSE, FALSE),
(1, 2, 'โปรเจค Cloud ใกล้ถึง deadline แล้ว!', '2026-05-04 09:00:00', FALSE, FALSE);

INSERT INTO settings (user_id, theme, reminder_days, notification_enabled)
VALUES
(1, 'light', 1, TRUE);

SELECT * FROM users;
SELECT * FROM tasks;
SELECT * FROM notifications;
SELECT * FROM settings;

SELECT 
    u.name,
    t.title,
    t.due_date,
    t.status,
    n.message,
    n.notify_date
FROM users u
JOIN tasks t ON u.user_id = t.user_id
LEFT JOIN notifications n ON t.task_id = n.task_id
WHERE u.user_id = 1;
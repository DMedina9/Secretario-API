const clients = new Set();

export const sseHandler = (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    });

    // Send a comment to establish the stream
    res.write(': connected\n\n');

    const client = res;
    clients.add(client);

    req.on('close', () => {
        clients.delete(client);
    });
};

export const broadcast = (data, event = 'message') => {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    for (const res of clients) {
        try {
            res.write(`event: ${event}\n`);
            res.write(`data: ${payload}\n\n`);
        } catch (e) {
            // Ignore write errors; remove client
            clients.delete(res);
        }
    }
};

export default { sseHandler, broadcast };

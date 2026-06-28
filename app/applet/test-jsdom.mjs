import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

(async () => {
    // Read the compiled index template
    const html = fs.readFileSync('dist/index.html', 'utf8');
    
    // Create a virtual console to catch errors
    const virtualConsole = new jsdom.VirtualConsole();
    virtualConsole.on("error", (err) => {
        console.error("JSDOM ERROR:", err);
    });
    virtualConsole.on("warn", (warn) => {
        // console.warn("JSDOM WARN:", warn);
    });
    virtualConsole.on("log", (log) => {
        console.log("JSDOM LOG:", log);
    });
    
    const dom = new JSDOM(html, {
        runScripts: "dangerously",
        resources: "usable",
        url: "http://localhost:3000/",
        virtualConsole
    });
    
    // Wait for scripts to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log("Root content length:", dom.window.document.getElementById('root')?.innerHTML.length);
})();

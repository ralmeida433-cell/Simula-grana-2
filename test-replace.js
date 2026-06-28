const template = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />`;
console.log(template.replace('<head>', '<head>\n<script>...</script>'));

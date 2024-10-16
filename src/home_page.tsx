import config from "@/config.ts";

const styles = `
@import url("https://fonts.googleapis.com/css?family=Fira+Mono|Roboto");

body {
  margin: 40px auto;
  max-width: 650px;
  line-height: 1.6;
  font-size: 18px;
  color: #444;
  padding: 0 10px;
}

h1,
h2,
h3 {
  line-height: 1.2;
  padding-bottom: 0.2rem;
  border-bottom: 1px solid gainsboro;
}

h1,
h2,
h3,
h4,
h5,
h6,
p,
a {
  font-family: "Roboto", sans-serif;
}

a:visited {
  color: blue;
}

pre {
  display: flex;
  flex-direction: column;
  background-color: whitesmoke;
  border-radius: 4px;
  padding: 1rem 0.5rem;
}

pre > * + * {
  margin-top: 1.5rem;
}

pre,
code {
  white-space: normal;
  font-family: "Fira Mono", monospace;
}
`;

export default function HomePage() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Dicer</title>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </head>
      <body>
        <script>0</script>
        <main>
          <h1>Dicer</h1>
          <p>
            Dicer is a Discord bot that rolls dices with basic math expressions.
          </p>
          <p>
            You can add to your discord server by following the invite url{" "}
            <a
              href={`https://discord.com/oauth2/authorize?client_id=${config.DISCORD_APPLICATION_ID}&scope=bot`}
            >
              here
            </a>
            .
          </p>
          <h2>Usage</h2>
          <p>You can perform basic rolls this way:</p>
          <pre>
            <code>/roll 2d20+10</code>
            <code>Dicer: (8 + 12) + 10 = 30</code>
          </pre>
          <p>
            You can browse more commands with the new Discord commands
            integration!
          </p>
          <p>
            You can also check the dice expression documentation{" "}
            <a href="https://dice-roller.github.io/documentation/guide/notation/dice.html">
              here
            </a>
            .
          </p>
          <p>
            <a href="https://github.com/jfranciscosousa/dicer">
              Check me out on Github
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}

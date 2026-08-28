[![DPG Badge](https://img.shields.io/badge/Verified-DPG-3333AB?logo=data:image/svg%2bxml;base64,PHN2ZyB3aWR0aD0iMzEiIGhlaWdodD0iMzMiIHZpZXdCb3g9IjAgMCAzMSAzMyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE0LjIwMDggMjEuMzY3OEwxMC4xNzM2IDE4LjAxMjRMMTEuNTIxOSAxNi40MDAzTDEzLjk5MjggMTguNDU5TDE5LjYyNjkgMTIuMjExMUwyMS4xOTA5IDEzLjYxNkwxNC4yMDA4IDIxLjM2NzhaTTI0LjIwMDggMzMuMDcyOUMyMC44NTk1IDMzLjA3MjkgMjYuMjQ2OSAzMC40NTE2IDI5LjE0MTcgMjYuMzEyOUwyNC44MDcxIDI5LjEwNkwyNC42MjQxIDIyLjgyNzdMMzAuNjYzMSAyMS4wNjEyTDI2LjgxNzYgMTYuMDg5NUwzMC42NjMxIDExLjExNzdMMjQuNjI0MSA5LjM1MTI3TDI0LjgwNzEgMy4wNzI5N0wyNi4yNDY5IDIuNjIwMThDMjAuODU5NSAtMS40MTg0NCAxNC4yMDA4IC0xLjQxODQ0IDguODUzMzMgMi42MjAxOEw1Ljg1NjAxIDMuMDcyOTdMNi4wMzkwNiA5LjM1MTI3TDAgMTEuMTE3N0wzLjg0NTIxIDE2LjA4OTVMMCAyMS4wNjEyTDYuMDM5MDYgMjIuODI3N0w1Ljg1NjAxIDI5LjEwNkwxMS43ODIxIDI2Ljk5MjNMMTQuMjAwOCAzMy4wNzI5WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==)](https://digitalpublicgoods.net/r/cboard)
[![Crowdin](https://d322cqt584bo4o.cloudfront.net/cboard/localized.svg)](https://crowdin.com/project/cboard)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

# Controle Total (Baseado no Cboard) ♿

**Projeto de Iniciação Científica - Apresentado na FETIN (Feira Tecnológica do Inatel)**

O **Controle Total** é uma solução de acessibilidade que integra um hardware customizado a um software de Comunicação Aumentativa e Alternativa (CAA). O projeto foi desenvolvido de forma aplicada para atender às necessidades motoras e de fala de usuários com paralisia cerebral, promovendo comunicação, autonomia e inclusão.

👨‍🔬 **Equipe (Inatel):**

- Gabriel Machado Pivoto
- Letícia Geovana Garcia
- Júlia Gonçalves Rocha Garcia
- Maria Clara Ribeiro Coura
- Ana Luiza Grell de Souza
- **Orientador:** Prof. Filipe Bueno Vilela
- **Coorientador:** Rita Elizabeth Santos de Almeida
- **Apoio/Fomento:** FAPEMIG

⚠️ **Aviso de Modificação e Créditos:** Este projeto é uma versão modificada, estendida e integrada com hardware do incrível projeto open-source [Cboard](https://github.com/cboard-org/cboard). Nós adaptamos o software original para receber comandos do nosso hardware dedicado, focando inteiramente nas necessidades reais do nosso usuário.

---

## 🚀 O que nós construímos (Nossas Modificações)

Nosso projeto não é apenas software, é a união do mundo físico com o digital:

- **Hardware Customizado:** Desenvolvemos uma interface física em MDF, adaptada às limitações motoras do paciente. A estrutura possui botões de alta resistência com espaçamento ergonômico, projetada para absorver impactos (espasmos) e fixar-se com segurança à mesa de uso.
- **Integração de Sinais:** O hardware se comunica com o software através de uma placa Arduino, que emula comandos de teclado (_KeyEvents_ como setas de navegação, Enter, Backspace e atalhos customizados). Isso permite o controle 100% autônomo do sistema sem necessidade de toque na tela.
- **Adaptações na Interface (UX/UI e Lógica):** O software original sofreu profundas alterações para respeitar o tempo de reação e a fadiga do paciente:
  - **Barra de Acúmulo de Voz:** Fim da emissão sonora imediata. O usuário seleciona os cards no próprio ritmo, e a síntese de voz (TTS) só é disparada ao acionar o botão global "Falar", reduzindo a ansiedade.
  - **Confinamento de Foco (_Focus Trapping_):** Restrição da navegação do hardware apenas à área útil dos cards, evitando que o paciente gaste esforço motor navegando por menus superiores.
  - **Redução de Carga Cognitiva:** Limpeza visual da interface, remoção de menus secundários (impressão, configurações complexas) e distanciamento estratégico de botões críticos (ex: "Apagar Card" vs "Apagar Tudo") para prevenir erros por movimentos involuntários.
  - **Hospedagem em Nuvem:** O sistema foi preparado para _deploy_ na plataforma Vercel, eliminando instalações locais e permitindo acesso rápido via link de navegador em qualquer tablet ou computador.

---

_(Abaixo, mantemos as instruções originais do Cboard para desenvolvedores que desejam compilar e rodar a base do sistema localmente)._

## 💻 Sobre o Cboard Original

[Cboard](https://app.cboard.io) is an augmentative and alternative communication (AAC) web application, allowing users with speech and language impairments (autism, cerebral palsy) to communicate with symbols and text-to-speech.

The app uses the browser's Speech Synthesis API to generate speech when a symbol is clicked. There are thousands of symbols from the most popular AAC symbol libraries to choose from when creating a board.

## Getting Started

### `yarn start`

Runs the app in development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will see the build errors and lint warnings in the console.

### `yarn test`

Runs the test watcher in an interactive mode.

### `yarn build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

## Thanks (Fontes Originais do Cboard)

### Symbols sources

- [Mulberry](https://mulberrysymbols.org/)
- [ARASAAC](http://www.arasaac.org/)
- [Global Symbols](https://globalsymbols.com/)

---

## :memo: Legal & licenses

**Modificações do Controle Total (Hardware e Software integrado):**
Copyright © 2024-2026, Gabriel, Letícia, Julia, Maria, Ana & Inatel.

**Software Original (Cboard):**
Copyright © 2017-2024, Assistive Technology LLC & Cboard contributors.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License version 3 as published by the Free Software Foundation.

- Code - [GPLv3](https://github.com/cboard-org/cboard/blob/master/LICENSE.txt)
- Mulberry Symbols - [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- ARASAAC Symbols - [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

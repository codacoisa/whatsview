# WhatsView

Visualizador local de conversas exportadas do WhatsApp. Abra um arquivo `.zip` (com mídia) ou `.txt` e navegue por mensagens, imagens, vídeos, PDFs e áudios em uma interface inspirada no WhatsApp.

## Privacidade

O processamento acontece integralmente no navegador. Chats e anexos não são enviados a nenhum servidor, não são salvos pelo projeto e desaparecem da memória ao fechar ou recarregar a página.

## Recursos

- ZIP ou TXT exportado pelo WhatsApp (Android e iOS)
- Imagens, vídeos, PDFs, documentos e áudio, incluindo `.opus`
- Busca local, datas agrupadas e escolha do próprio participante
- Interface responsiva em `pt-BR`, `en-US`, `es-MX` e hindi (`hi-IN`)
- Hospedagem estática compatível com GitHub Pages

## Usar localmente

Instale as dependências e inicie o ambiente local:

```sh
npm install
npm run dev
```

O endereço local será exibido no terminal. O build inclui o descompactador no próprio site.

## Publicar no GitHub Pages

1. Envie este diretório para um repositório GitHub.
2. Em **Settings → Pages → Build and deployment**, escolha **GitHub Actions**.
3. Envie alterações à branch `main`; o workflow compila e publica o site automaticamente.

## Referências e inspirações

Esta implementação foi escrita do zero. O conceito e a seleção de recursos foram informados por projetos abertos existentes:

- [Pustur/whatsapp-chat-parser-website](https://github.com/Pustur/whatsapp-chat-parser-website) — principal referência de experiência local para ZIP/TXT e mídia (MIT).
- [rodrigodesalvobraz/whatsapp-chat-viewer](https://github.com/rodrigodesalvobraz/whatsapp-chat-viewer) — referência para tipos de anexos e alinhamento do próprio usuário (MIT).
- [Dexter2389/whatsapp-backup-chat-viewer](https://github.com/Dexter2389/whatsapp-backup-chat-viewer) — referência de navegação de backups.
- [srilakshmikanthanp/chatviewer](https://github.com/srilakshmikanthanp/chatviewer) — referência visual para conversas exportadas.
- [vitormarcal/chatvault](https://github.com/vitormarcal/chatvault) — referência de experiência de arquivamento e visualização (MIT).

Veja [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) para a dependência usada em tempo de execução.

## Licença

[MIT](LICENSE.md) © 2026 Lourenço

WhatsApp é uma marca da Meta Platforms, Inc. Este projeto não é afiliado, patrocinado ou endossado pela Meta ou pelo WhatsApp.

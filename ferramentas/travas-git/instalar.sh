#!/bin/sh
# Instala as travas locais contra a main (rodar uma vez em cada clone: sh ferramentas/travas-git/instalar.sh).
# pre-commit: não deixa commitar na main. pre-push: não deixa enviar para a main (só ramo + pull request).
cd "$(git rev-parse --show-toplevel)" || exit 1
cp ferramentas/travas-git/pre-commit ferramentas/travas-git/pre-push .git/hooks/ && chmod +x .git/hooks/pre-commit .git/hooks/pre-push
echo "Travas instaladas: commit e envio para a main bloqueados neste clone."

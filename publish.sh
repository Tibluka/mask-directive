#!/bin/bash

# Caminho do arquivo package.json (dentro do projeto)
PACKAGE_JSON_PATH="projects/mask-directive/package.json"

# Caminho do arquivo package.json (na raiz do projeto)
ROOT_PACKAGE_JSON_PATH="package.json"

# Função para atualizar a versão no package.json
update_version() {
  local package_json_path=$1
  local new_version=$2

  # Use jq para atualizar a versão no package.json
  jq --arg version "$new_version" '.version = $version' "$package_json_path" > temp.json && mv temp.json "$package_json_path"

  # Verifique se a alteração foi bem-sucedida
  if [ $? -eq 0 ]; then
    echo "Versão alterada para $new_version em $package_json_path"
  else
    echo "Falha ao alterar a versão em $package_json_path"
    exit 1
  fi
}

# Verifique se o arquivo package.json existe dentro de /projects/mask-directive
if [ ! -f "$PACKAGE_JSON_PATH" ]; then
  echo "Arquivo $PACKAGE_JSON_PATH não encontrado!"
  exit 1
fi

# Obtenha a versão atual do package.json dentro de /projects/mask-directive usando jq
CURRENT_VERSION=$(jq -r '.version' "$PACKAGE_JSON_PATH")

# Verifique se a versão foi encontrada
if [ -z "$CURRENT_VERSION" ]; then
  echo "Não foi possível encontrar a versão no $PACKAGE_JSON_PATH"
  exit 1
fi

# Divida a versão em 3 partes: major, minor, patch
IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"

# Incrementa a versão de patch
patch=$((patch + 1))

# Crie a nova versão
NEW_VERSION="$major.$minor.$patch"

# Atualizar a versão dentro de /projects/mask-directive/package.json
update_version "$PACKAGE_JSON_PATH" "$NEW_VERSION"

# Verifique se o arquivo package.json da raiz existe
if [ ! -f "$ROOT_PACKAGE_JSON_PATH" ]; then
  echo "Arquivo $ROOT_PACKAGE_JSON_PATH não encontrado!"
  exit 1
fi

# Atualizar a versão no package.json da raiz
update_version "$ROOT_PACKAGE_JSON_PATH" "$NEW_VERSION"

# Build do projeto
npm run build || { echo "Falha na build"; exit 1; }

# Navegar para a pasta dist
cd dist/mask-directive || { echo "Diretório não encontrado: dist/mask-directive"; exit 1; }

# Publicar a library no npm
#npm publish --tag latest || { echo "Falha ao publicar"; exit 1; }
npm publish --tag angular-13 || { echo "Falha ao publicar"; exit 1; }

echo "Library publicada com sucesso!"
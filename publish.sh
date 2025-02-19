#!/bin/bash

# Caminho do arquivo package.json (dentro do projeto)
PACKAGE_JSON_PATH="projects/mask-directive/package.json"

# Caminho do arquivo package.json (na raiz do projeto)
ROOT_PACKAGE_JSON_PATH="package.json"

# Função para atualizar a versão no package.json
update_version() {
  local package_json_path=$1
  local new_version=$2
  local peer_dependencies=$3

  # Use jq para atualizar a versão e peerDependencies corretamente
  jq --arg version "$new_version" --argjson peerDeps "$peer_dependencies" \
    '.version = $version | .peerDependencies = $peerDeps' \
    "$package_json_path" > temp.json && mv temp.json "$package_json_path"

  # Verifique se a alteração foi bem-sucedida
  if [ $? -eq 0 ]; then
    echo "Versão alterada para $new_version e peerDependencies atualizadas em $package_json_path"
  else
    echo "Falha ao alterar a versão ou peerDependencies em $package_json_path"
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

# Determine as peerDependencies com base na versão a ser publicada
read -p "Digite a versão para publicação (angular-13 ou latest): " version_type

if [ "$version_type" == "angular-13" ]; then
  PEER_DEPENDENCIES='{"@angular/common": "^13.1.0", "@angular/core": "^13.1.0"}'
elif [ "$version_type" == "latest" ]; then
  PEER_DEPENDENCIES='{"@angular/common": "^18.2.0", "@angular/core": "^18.2.0"}'
else
  echo "Versão inválida! Use 'angular-13' ou 'latest'."
  exit 1
fi

# Atualizar a versão e peerDependencies dentro de /projects/mask-directive/package.json
update_version "$PACKAGE_JSON_PATH" "$NEW_VERSION" "$PEER_DEPENDENCIES"

# Verifique se o arquivo package.json da raiz existe
if [ ! -f "$ROOT_PACKAGE_JSON_PATH" ]; then
  echo "Arquivo $ROOT_PACKAGE_JSON_PATH não encontrado!"
  exit 1
fi

# Atualizar a versão e peerDependencies no package.json da raiz
update_version "$ROOT_PACKAGE_JSON_PATH" "$NEW_VERSION" "$PEER_DEPENDENCIES"

# Build do projeto
npm run build || { echo "Falha na build"; exit 1; }

# Verificar se o diretório dist/mask-directive foi gerado
if [ ! -d "dist/mask-directive" ]; then
  echo "Diretório dist/mask-directive não encontrado após build!"
  exit 1
fi

# Navegar para a pasta dist
cd dist/mask-directive || exit 1

# Publicar a library no npm
npm publish --tag "$version_type" || { echo "Falha ao publicar"; exit 1; }

echo "Library publicada com sucesso!"
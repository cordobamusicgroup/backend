#!/bin/bash

# Espera a que la base de datos esté lista antes de ejecutar el script de semilla
wait_for_db() {
  echo "Esperando a que la base de datos esté lista..."
  until pnpm prisma migrate deploy; do
    echo "Esperando por la base de datos..."
    sleep 5
  done
}

# Función para ejecutar el script de semilla
run_seed() {
  echo "Ejecutando el script de semilla..."
  pnpm exec -- ts-node prisma/seed.ts
}

# Llamar a las funciones en orden
wait_for_db
run_seed

echo "Script de semilla completado."

import React from "react";
import Button from "./Button"; // Asegúrate de que Button está en la ruta correcta

export default function DroneCard({ drone, onEdit, onDelete }) {
  return (
    <div className="max-w-sm rounded-lg border border-gray-300 bg-white shadow-sm p-4">
      {/* Nombre del Drone */}
      <h2 className="text-xl font-semibold">{drone.name}</h2>
      <p className="text-sm text-gray-600">ID: {drone.id}</p>

      {/* Video */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold">Video</h3>
        <ul className="text-sm text-gray-600">
          <li>Analógico: {drone.video?.analogico ? "Sí" : "No"}</li>
          <li>Digital: {drone.video?.digital ? "Sí" : "No"}</li>
        </ul>
      </div>

      {/* Radio */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold">Radio</h3>
        <p className="text-sm text-gray-600">{drone.radio || "No especificado"}</p>
      </div>

      {/* Componentes */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold">Componentes</h3>
        <p className="text-sm text-gray-600">{drone.componentes || "No especificado"}</p>
      </div>

      {/* Controladora */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold">Controladora</h3>
        <ul className="text-sm text-gray-600">
          <li>Betaflight: {drone.controladora?.betaflight ? "Sí" : "No"}</li>
          <li>Kiss: {drone.controladora?.kiss ? "Sí" : "No"}</li>
        </ul>
      </div>

      {/* Tipo de Drone */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold">Tipo de Drone</h3>
        <p className="text-sm text-gray-600">{drone.tipo || "No especificado"}</p>
      </div>

      {/* Notas */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold">Notas</h3>
        <p className="text-sm text-gray-600">{drone.notas || "No hay notas"}</p>
      </div>

      {/* Fecha de creación */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold">Fecha de Creación</h3>
        <p className="text-sm text-gray-600">{new Date(drone.created_at).toLocaleDateString()}</p>
      </div>

      {/* Botones */}
      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={() => onEdit(drone)}>Editar</Button>
        <Button variant="outline" onClick={() => onDelete(drone.id)}>Eliminar</Button>
      </div>
    </div>
  );
}

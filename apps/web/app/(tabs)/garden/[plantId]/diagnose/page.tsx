"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import {
  diagnosePlantPhoto,
  getPlantById,
  getPlantPhotos,
  isAPIError,
  type DiagnosePlantPhotoResponse,
  type Plant,
  type PlantPhoto,
} from "@/lib/api"

export default function PlantDiagnosePage() {
  const params = useParams<{ plantId: string }>()
  const plantId = params?.plantId ?? ""

  const [plant, setPlant] = useState<Plant | null>(null)
  const [photos, setPhotos] = useState<PlantPhoto[]>([])
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)

  const [diagnosis, setDiagnosis] = useState<DiagnosePlantPhotoResponse | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!plantId) {
      setErrorMessage("No encontramos el identificador de la planta.")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [plantData, photosData] = await Promise.all([
        getPlantById(plantId),
        getPlantPhotos(plantId),
      ])

      setPlant(plantData)
      setPhotos(photosData)
      setSelectedPhotoId((current) => {
        if (current && photosData.some((photo) => photo.id === current)) {
          return current
        }
        return photosData[0]?.id ?? null
      })
    } catch (error: unknown) {
      if (isAPIError(error) && error.message.trim()) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage("No pudimos cargar las fotos para diagnostico.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [plantId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === selectedPhotoId) ?? null,
    [photos, selectedPhotoId]
  )

  const onAnalyze = useCallback(async () => {
    if (!plantId || !selectedPhoto || isAnalyzing) {
      return
    }

    setIsAnalyzing(true)
    setAnalyzeError(null)

    try {
      const result = await diagnosePlantPhoto({
        plant_id: plantId,
        photo_url: selectedPhoto.url,
      })
      setDiagnosis(result)
    } catch (error: unknown) {
      if (isAPIError(error) && error.message.trim()) {
        setAnalyzeError(error.message)
      } else {
        setAnalyzeError("No pudimos generar el diagnostico. Intenta de nuevo.")
      }
    } finally {
      setIsAnalyzing(false)
    }
  }, [isAnalyzing, plantId, selectedPhoto])

  return (
    <div className="ag-container ag-screen">
      <div className="ag-panel space-y-6">
        <section className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="w-fit">
            <Link href={`/garden/${plantId}`}>Volver a la ficha</Link>
          </Button>

          <h1 className="text-primary text-2xl font-semibold tracking-tight">
            Diagnostico por foto
          </h1>
          <p className="text-secondary text-sm">
            {plant
              ? `Selecciona una foto de ${plant.nickname} para analizarla con Toni.`
              : "Selecciona una foto de la planta para analizarla con Toni."}
          </p>
        </section>

        {errorMessage ? (
          <Card>
            <CardContent>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <Card>
            <CardContent>
              <p className="text-secondary text-sm">Cargando fotos...</p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !errorMessage && photos.length === 0 ? (
          <Card>
            <CardContent className="space-y-3">
              <p className="text-primary text-sm font-medium">Aun no hay fotos para esta planta.</p>
              <p className="text-secondary text-sm">
                Para usar el diagnostico visual, primero sube al menos una foto.
              </p>
              <Button asChild variant="secondary" size="sm" className="w-fit">
                <Link href={`/garden/${plantId}/photos`}>Ir a fotos</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !errorMessage && photos.length > 0 ? (
          <>
            <section className="space-y-2">
              <h2 className="text-primary text-lg font-semibold">Selecciona una foto</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((photo) => {
                  const isSelected = selectedPhotoId === photo.id

                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setSelectedPhotoId(photo.id)}
                      className={`overflow-hidden rounded-xl border text-left transition ${
                        isSelected
                          ? "border-ag-primary ring-2 ring-ag-primary/40"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption ?? "Foto de la planta"}
                        className="h-36 w-full object-cover"
                      />
                      <div className="bg-white/5 px-2 py-1.5">
                        <p className="text-primary truncate text-xs font-medium">
                          {photo.caption ?? "Sin descripcion"}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            <Card>
              <CardContent className="space-y-3">
                <Button
                  type="button"
                  disabled={!selectedPhoto || isAnalyzing}
                  onClick={() => void onAnalyze()}
                >
                  {isAnalyzing ? "Analizando..." : "Analizar con Toni"}
                </Button>

                {analyzeError ? <p className="text-sm text-red-700">{analyzeError}</p> : null}
              </CardContent>
            </Card>
          </>
        ) : null}

        {diagnosis ? (
          <Card>
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-primary text-lg font-semibold">Resultado del diagnostico</h2>
                <p className="text-secondary text-xs">ID: {diagnosis.diagnosis_id}</p>
              </div>

              <section className="space-y-2">
                <h3 className="text-primary text-sm font-semibold">Posibles causas</h3>
                {diagnosis.possible_causes.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5">
                    {diagnosis.possible_causes.map((item, index) => (
                      <li key={`cause-${index}`} className="text-secondary text-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-secondary text-sm">Sin causas sugeridas.</p>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-primary text-sm font-semibold">Plan de accion</h3>
                {diagnosis.action_plan.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5">
                    {diagnosis.action_plan.map((item, index) => (
                      <li key={`action-${index}`} className="text-secondary text-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-secondary text-sm">Sin acciones sugeridas.</p>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-primary text-sm font-semibold">Preguntas de confirmacion</h3>
                {diagnosis.confirmation_questions.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5">
                    {diagnosis.confirmation_questions.map((item, index) => (
                      <li key={`question-${index}`} className="text-secondary text-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-secondary text-sm">Sin preguntas por ahora.</p>
                )}
              </section>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

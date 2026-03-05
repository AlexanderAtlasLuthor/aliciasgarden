"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { FormEvent, useCallback, useEffect, useState } from "react"

import Button from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import {
  getPlantById,
  getPlantPhotos,
  isAPIError,
  uploadPlantPhoto,
  type Plant,
  type PlantPhoto,
} from "@/lib/api"

function formatDate(value: string | null): string {
  if (!value) {
    return "Sin fecha"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Fecha invalida"
  }

  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(date)
}

export default function PlantPhotosPage() {
  const params = useParams<{ plantId: string }>()
  const plantId = params?.plantId ?? ""

  const [plant, setPlant] = useState<Plant | null>(null)
  const [photos, setPhotos] = useState<PlantPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [caption, setCaption] = useState("")
  const [takenAt, setTakenAt] = useState("")

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!plantId) {
      setErrorMessage("No encontramos el identificador de la planta.")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [plantData, photoData] = await Promise.all([
        getPlantById(plantId),
        getPlantPhotos(plantId),
      ])

      setPlant(plantData)
      setPhotos(photoData)
    } catch (error: unknown) {
      if (isAPIError(error) && error.message.trim()) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage("No pudimos cargar las fotos de la planta.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [plantId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!plantId) {
      setUploadMessage("No encontramos el identificador de la planta.")
      return
    }

    if (!selectedFile) {
      setUploadMessage("Selecciona una imagen para subir.")
      return
    }

    let normalizedTakenAt: string | undefined
    if (takenAt.trim()) {
      const parsedDate = new Date(takenAt)
      if (Number.isNaN(parsedDate.getTime())) {
        setUploadMessage("La fecha de captura es invalida.")
        return
      }
      normalizedTakenAt = parsedDate.toISOString()
    }

    setUploadMessage(null)
    setIsUploading(true)

    try {
      await uploadPlantPhoto(plantId, {
        file: selectedFile,
        caption,
        taken_at: normalizedTakenAt,
      })

      setSelectedFile(null)
      setCaption("")
      setTakenAt("")

      const fileInput = document.getElementById("photo-file") as HTMLInputElement | null
      if (fileInput) {
        fileInput.value = ""
      }

      await loadData()
      setUploadMessage("Foto subida correctamente.")
    } catch (error: unknown) {
      if (isAPIError(error) && error.message.trim()) {
        setUploadMessage(error.message)
      } else {
        setUploadMessage("No pudimos subir la foto. Intenta de nuevo.")
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="ag-container ag-screen">
      <div className="ag-panel space-y-6">
        <section className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="w-fit">
            <Link href={`/garden/${plantId}`}>Volver a la ficha</Link>
          </Button>
          <h1 className="text-primary text-2xl font-semibold tracking-tight">
            Fotos {plant ? `de ${plant.nickname}` : "de la planta"}
          </h1>
          <p className="text-secondary text-sm">Sube y revisa el historial visual de tu planta.</p>
        </section>

        <Card>
          <CardContent>
            <form className="space-y-3" onSubmit={onSubmit}>
              <div className="space-y-1">
                <label htmlFor="photo-file" className="text-primary text-sm font-medium">
                  Imagen
                </label>
                <input
                  id="photo-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    setSelectedFile(file)
                  }}
                  className="glass-soft text-primary w-full rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="photo-caption" className="text-primary text-sm font-medium">
                  Descripcion (opcional)
                </label>
                <input
                  id="photo-caption"
                  type="text"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  className="glass-soft text-primary w-full rounded-xl px-3 py-2 text-sm"
                  placeholder="Ej. Hoja nueva en marzo"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="photo-taken-at" className="text-primary text-sm font-medium">
                  Fecha de captura (opcional)
                </label>
                <input
                  id="photo-taken-at"
                  type="datetime-local"
                  value={takenAt}
                  onChange={(event) => setTakenAt(event.target.value)}
                  className="glass-soft text-primary w-full rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <Button type="submit" disabled={isUploading}>
                {isUploading ? "Subiendo..." : "Subir foto"}
              </Button>

              {uploadMessage ? <p className="text-sm text-secondary">{uploadMessage}</p> : null}
            </form>
          </CardContent>
        </Card>

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
            <CardContent>
              <p className="text-secondary text-sm">Aun no hay fotos para esta planta.</p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !errorMessage && photos.length > 0 ? (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden">
                <img src={photo.url} alt={photo.caption ?? "Foto de la planta"} className="h-48 w-full object-cover" />
                <CardContent className="space-y-1">
                  <p className="text-primary text-sm font-medium">{photo.caption ?? "Sin descripcion"}</p>
                  <p className="text-secondary text-xs">
                    Capturada: {formatDate(photo.taken_at)} · Subida: {formatDate(photo.created_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  )
}

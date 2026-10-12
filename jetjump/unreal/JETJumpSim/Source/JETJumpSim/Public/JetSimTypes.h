// JETJump — tipos de la simulación (independientes del render).
// Unidades de la simulación: metros, segundos, radianes.
// Ejes de la simulación: X este, Z sur, Y arriba. Conversión a Unreal: UE.X = X·100, UE.Y = Z·100, UE.Z = Y·100,
// yaw UE (grados) = heading (rad) · 180/π. Con ese mapeo "girar a la derecha" coincide en los dos mundos.
#pragma once

#include "CoreMinimal.h"
#include "JetSimTypes.generated.h"

UENUM(BlueprintType)
enum class EJetGait : uint8
{
	Halt = 0 UMETA(DisplayName = "Parado"),
	Walk = 1 UMETA(DisplayName = "Paso"),
	Trot = 2 UMETA(DisplayName = "Trote"),
	Canter = 3 UMETA(DisplayName = "Galope"),
	Gallop = 4 UMETA(DisplayName = "Galope largo"),
};

UENUM(BlueprintType)
enum class EJetMode : uint8
{
	TableA UMETA(DisplayName = "Tabla A"),
	TableC UMETA(DisplayName = "Tabla C"),
	Training UMETA(DisplayName = "Entrenamiento"),
	Power UMETA(DisplayName = "Potencia"),
};

UENUM(BlueprintType)
enum class EJetFenceType : uint8
{
	Vertical UMETA(DisplayName = "Vertical"),
	Oxer UMETA(DisplayName = "Oxer"),
	TripleBar UMETA(DisplayName = "Triple barra"),
	Wall UMETA(DisplayName = "Muro"),
	Liverpool UMETA(DisplayName = "Liverpool"),
	Water UMETA(DisplayName = "Ría"),
	Gate UMETA(DisplayName = "Vertical con tranquera"),
};

UENUM(BlueprintType)
enum class EJetLayout : uint8
{
	Clasico UMETA(DisplayName = "Clásico"),
	GranPremio UMETA(DisplayName = "Gran Premio"),
	Indoor UMETA(DisplayName = "Indoor"),
};

UENUM(BlueprintType)
enum class EJetEvent : uint8
{
	Start, Gait, Hoof, Stride, Lead, Takeoff, Knock, Rub, Land, Water, Refusal, Halt, Fall, Cleared, Finish, Eliminated, Feedback,
};

UENUM(BlueprintType)
enum class EJetSpot : uint8
{
	Perfect UMETA(DisplayName = "Perfecta"),
	Long UMETA(DisplayName = "Larga"),
	Deep UMETA(DisplayName = "Profunda"),
};

/** Un plano de barra: desplazamiento desde el frente de la valla y altura. */
USTRUCT(BlueprintType)
struct JETJUMPSIM_API FJetPlane
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Offset = 0.f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Height = 1.3f;
};

USTRUCT(BlueprintType)
struct JETJUMPSIM_API FJetFence
{
	GENERATED_BODY()
	UPROPERTY(BlueprintReadOnly) int32 Index = 0;
	UPROPERTY(BlueprintReadOnly) int32 Number = 1;
	UPROPERTY(BlueprintReadOnly) FString Label = TEXT("1");
	UPROPERTY(BlueprintReadOnly) EJetFenceType Type = EJetFenceType::Vertical;
	/** Centro del primer plano, metros (X este, Z sur). */
	UPROPERTY(BlueprintReadOnly) float X = 0.f;
	UPROPERTY(BlueprintReadOnly) float Z = 0.f;
	/** Sentido de salto, radianes. */
	UPROPERTY(BlueprintReadOnly) float Heading = 0.f;
	UPROPERTY(BlueprintReadOnly) float Height = 1.3f;
	UPROPERTY(BlueprintReadOnly) float HalfWidth = 1.75f;
	UPROPERTY(BlueprintReadOnly) float Spread = 0.f;
	UPROPERTY(BlueprintReadOnly) TArray<FJetPlane> Planes;
	UPROPERTY(BlueprintReadOnly) bool bWater = false;
	UPROPERTY(BlueprintReadOnly) float WaterStart = 0.f;
	UPROPERTY(BlueprintReadOnly) float WaterEnd = 0.f;
	UPROPERTY(BlueprintReadOnly) int32 ComboStart = 0;
	UPROPERTY(BlueprintReadOnly) int32 ComboPos = 0;
	UPROPERTY(BlueprintReadOnly) int32 ComboLen = 1;
	UPROPERTY(BlueprintReadOnly) int32 Scheme = 0;

	FVector2D N() const { return FVector2D(FMath::Cos(Heading), FMath::Sin(Heading)); }
	FVector2D L() const { return FVector2D(-FMath::Sin(Heading), FMath::Cos(Heading)); }
	/** Posición en Unreal (cm) del centro del primer plano, a nivel del suelo. */
	UPROPERTY(BlueprintReadOnly) FVector WorldLocation = FVector::ZeroVector;
	UPROPERTY(BlueprintReadOnly) FRotator WorldRotation = FRotator::ZeroRotator;
};

USTRUCT(BlueprintType)
struct JETJUMPSIM_API FJetLine
{
	GENERATED_BODY()
	UPROPERTY(BlueprintReadOnly) float X = 0.f;
	UPROPERTY(BlueprintReadOnly) float Z = 0.f;
	UPROPERTY(BlueprintReadOnly) float Heading = 0.f;
	UPROPERTY(BlueprintReadOnly) float HalfWidth = 4.f;
	UPROPERTY(BlueprintReadOnly) FVector WorldLocation = FVector::ZeroVector;
	UPROPERTY(BlueprintReadOnly) FRotator WorldRotation = FRotator::ZeroRotator;
};

USTRUCT(BlueprintType)
struct JETJUMPSIM_API FJetCourse
{
	GENERATED_BODY()
	UPROPERTY(BlueprintReadOnly) EJetLayout Layout = EJetLayout::Clasico;
	UPROPERTY(BlueprintReadOnly) FString Name;
	UPROPERTY(BlueprintReadOnly) float ArenaWidth = 90.f;
	UPROPERTY(BlueprintReadOnly) float ArenaDepth = 60.f;
	UPROPERTY(BlueprintReadOnly) bool bIndoor = false;
	UPROPERTY(BlueprintReadOnly) TArray<FJetFence> Fences;
	UPROPERTY(BlueprintReadOnly) FJetLine Start;
	UPROPERTY(BlueprintReadOnly) FJetLine Finish;
	UPROPERTY(BlueprintReadOnly) float Height = 1.3f;
	UPROPERTY(BlueprintReadOnly) float SpeedMPM = 375.f;
	UPROPERTY(BlueprintReadOnly) bool bJumpOff = false;
	UPROPERTY(BlueprintReadOnly) float Length = 0.f;
	/** Tiempo acordado y tiempo límite, segundos. */
	UPROPERTY(BlueprintReadOnly) float TimeAllowed = 0.f;
	UPROPERTY(BlueprintReadOnly) float TimeLimit = 0.f;
};

/** Estadísticas del caballo (0..1 salvo Scope en metros). */
USTRUCT(BlueprintType)
struct JETJUMPSIM_API FJetHorseStats
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Scope = 1.55f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Tech = 0.6f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Care = 0.6f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Speed = 0.6f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Ride = 0.7f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Bold = 0.7f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Stamina = 0.7f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Form = 1.0f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Fitness = 1.0f;
};

USTRUCT(BlueprintType)
struct JETJUMPSIM_API FJetRiderSkills
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Eye = 0.5f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Balance = 0.5f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Nerve = 0.5f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Turns = 0.5f;
};

USTRUCT(BlueprintType)
struct JETJUMPSIM_API FJetInput
{
	GENERATED_BODY()
	/** -1 izquierda .. 1 derecha. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Steer = 0.f;
	/** -1 frenar .. 1 pierna (cambio de ritmo por segundo). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Pace = 0.f;
	/** Pulso: pedir el salto en este tick. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite) bool bJump = false;
	/** Si >= 0, fija el ritmo directamente (0..1). Lo usa la IA. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float PaceSet = -1.f;
};

USTRUCT(BlueprintType)
struct JETJUMPSIM_API FJetEvent
{
	GENERATED_BODY()
	UPROPERTY(BlueprintReadOnly) EJetEvent Type = EJetEvent::Start;
	UPROPERTY(BlueprintReadOnly) float Time = 0.f;
	UPROPERTY(BlueprintReadOnly) int32 Fence = -1;
	UPROPERTY(BlueprintReadOnly) int32 Plane = -1;
	UPROPERTY(BlueprintReadOnly) int32 Leg = -1;
	UPROPERTY(BlueprintReadOnly) float Value = 0.f;
	UPROPERTY(BlueprintReadOnly) EJetSpot Spot = EJetSpot::Perfect;
	UPROPERTY(BlueprintReadOnly) FString Text;
};

/** Información de la aproximación a la próxima valla, para HUD e IA. */
USTRUCT(BlueprintType)
struct JETJUMPSIM_API FJetApproach
{
	GENERATED_BODY()
	UPROPERTY(BlueprintReadOnly) bool bValid = false;
	UPROPERTY(BlueprintReadOnly) int32 Fence = -1;
	/** Distancia al primer plano, metros. */
	UPROPERTY(BlueprintReadOnly) float Distance = 0.f;
	UPROPERTY(BlueprintReadOnly) float Lateral = 0.f;
	UPROPERTY(BlueprintReadOnly) float CosAngle = 1.f;
	UPROPERTY(BlueprintReadOnly) float StrideLength = 3.f;
	UPROPERTY(BlueprintReadOnly) float IdealTakeoff = 2.f;
	UPROPERTY(BlueprintReadOnly) float Strides = 0.f;
	/** -0.5..0.5: 0 llega justo; positivo llega largo. Para el medidor del HUD. */
	UPROPERTY(BlueprintReadOnly) float Meter = 0.f;
	/** True cuando el próximo tranco cae en la zona de batida: momento de pedir el salto. */
	UPROPERTY(BlueprintReadOnly) bool bAskWindow = false;
};

USTRUCT(BlueprintType)
struct JETJUMPSIM_API FJetRoundResult
{
	GENERATED_BODY()
	UPROPERTY(BlueprintReadOnly) int32 Faults = 0;
	UPROPERTY(BlueprintReadOnly) float Time = 0.f;
	UPROPERTY(BlueprintReadOnly) float ScoreTime = 0.f;
	UPROPERTY(BlueprintReadOnly) bool bEliminated = false;
	UPROPERTY(BlueprintReadOnly) FString EliminationReason;
	UPROPERTY(BlueprintReadOnly) int32 Rails = 0;
	UPROPERTY(BlueprintReadOnly) int32 Refusals = 0;
};

namespace JetSim
{
	constexpr float G = 9.81f;
	constexpr float Y0 = 1.12f;
	constexpr float MetersToCm = 100.f;

	inline FVector ToUE(float X, float Y, float Z) { return FVector(X * MetersToCm, Z * MetersToCm, Y * MetersToCm); }
	inline FRotator YawToUE(float HeadingRad) { return FRotator(0.f, FMath::RadiansToDegrees(HeadingRad), 0.f); }
	inline float Clamp(float V, float A, float B) { return V < A ? A : (V > B ? B : V); }
	inline float AngDiff(float A, float B) { float D = B - A; while (D > PI) D -= 2 * PI; while (D < -PI) D += 2 * PI; return D; }
}

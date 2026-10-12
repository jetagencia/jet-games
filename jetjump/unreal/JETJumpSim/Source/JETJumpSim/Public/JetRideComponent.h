// JETJump — componente de Unreal que monta la simulación sobre cualquier caballo.
// Uso: agregarlo al Pawn del caballo (o al Character). Llamar StartRound con una pista
// (UJetSimLibrary::BuildCourse) y alimentarlo con SetInput desde el PlayerController.
// El componente mueve al actor (opcional) y expone el estado para el Animation Blueprint.
#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "JetSimTypes.h"
#include "JetSim.h"
#include "JetRideComponent.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FJetEventSignature, const FJetEvent&, Event);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FJetRoundEndSignature, const FJetRoundResult&, Result);

UCLASS(ClassGroup = (JETJump), meta = (BlueprintSpawnableComponent))
class JETJUMPSIM_API UJetRideComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UJetRideComponent();

	/** Empieza un recorrido. Si bAutoPilot, lo monta la IA (rivales en pista, demo del menú). */
	UFUNCTION(BlueprintCallable, Category = "JETJump")
	void StartRound(const FJetCourse& Course, const FJetHorseStats& Horse, const FJetRiderSkills& Rider, EJetMode Mode, int32 Seed, bool bAssist, bool bAutoPilot = false, float AutoSkill = 0.75f);

	UFUNCTION(BlueprintCallable, Category = "JETJump")
	void StopRound();

	/** Entrada del jugador (se mantiene hasta la próxima llamada; bJump es un pulso). */
	UFUNCTION(BlueprintCallable, Category = "JETJump")
	void SetInput(float Steer, float Pace, bool bJump);

	/** Pide el salto (equivale a SetInput con bJump). */
	UFUNCTION(BlueprintCallable, Category = "JETJump")
	void AskJump();

	UFUNCTION(BlueprintPure, Category = "JETJump") bool IsRunning() const { return bRunning; }
	UFUNCTION(BlueprintPure, Category = "JETJump") FJetApproach GetApproach() const;
	UFUNCTION(BlueprintPure, Category = "JETJump") int32 GetFaults() const;
	UFUNCTION(BlueprintPure, Category = "JETJump") int32 GetTimeFaults() const;
	UFUNCTION(BlueprintPure, Category = "JETJump") float GetTime() const;
	UFUNCTION(BlueprintPure, Category = "JETJump") float GetCountdownLeft() const;
	UFUNCTION(BlueprintPure, Category = "JETJump") int32 GetNextFence() const;
	UFUNCTION(BlueprintPure, Category = "JETJump") FJetCourse GetCourse() const { return CourseCopy; }
	const FJetCourse& CourseRef() const { return CourseCopy; }
	/** Acceso directo a la simulación (C++). Nulo si no hay recorrido. */
	FJetRide* GetRide() const { return Ride.Get(); }
	UFUNCTION(BlueprintPure, Category = "JETJump") FJetRoundResult GetResult() const;

	// ---- Estado para el Animation Blueprint (se actualiza cada tick)
	/** Velocidad m/s. */
	UPROPERTY(BlueprintReadOnly, Category = "JETJump|Anim") float Speed = 0.f;
	/** Velocidad en km/h, para el HUD. */
	UPROPERTY(BlueprintReadOnly, Category = "JETJump|Anim") float SpeedKmh = 0.f;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump|Anim") EJetGait Gait = EJetGait::Halt;
	/** Fase del tranco 0..1: usarla para sincronizar el ciclo de animación (Play Rate = 0, Explicit Time = Phase × duración). */
	UPROPERTY(BlueprintReadOnly, Category = "JETJump|Anim") float StridePhase = 0.f;
	/** Frecuencia de tranco (Hz): alternativa a la fase, como Play Rate = Freq × duración del clip. */
	UPROPERTY(BlueprintReadOnly, Category = "JETJump|Anim") float StrideFrequency = 0.f;
	/** +1 pie derecho, -1 izquierdo. */
	UPROPERTY(BlueprintReadOnly, Category = "JETJump|Anim") int32 Lead = 1;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump|Anim") bool bJumping = false;
	/** 0..1 progreso del salto: 0 batida, 0.5 ápice, 1 recepción. */
	UPROPERTY(BlueprintReadOnly, Category = "JETJump|Anim") float JumpProgress = 0.f;
	/** Altura del centro de masa sobre el suelo (m) y cabeceo (rad, positivo = nariz arriba). */
	UPROPERTY(BlueprintReadOnly, Category = "JETJump|Anim") float HeightAboveGround = 0.f;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump|Anim") float PitchRad = 0.f;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump|Anim") float RollRad = 0.f;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump|Anim") float TurnRate = 0.f;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump|Anim") bool bRefusing = false;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump|Anim") float Stamina = 1.f;

	/** Si true, el componente coloca al actor dueño (posición y yaw) cada tick. Si false, solo publica el estado. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") bool bDriveOwnerTransform = true;
	/** Origen del mundo de la pista (cm): el (0,0) de la simulación cae acá. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") FVector ArenaOrigin = FVector::ZeroVector;
	/** Altura del suelo en cm para colocar al actor. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") float GroundZ = 0.f;
	/** Pasos fijos de simulación por segundo (estable en cualquier framerate). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") int32 SubstepsPerSecond = 120;

	UPROPERTY(BlueprintAssignable, Category = "JETJump") FJetEventSignature OnEvent;
	UPROPERTY(BlueprintAssignable, Category = "JETJump") FJetRoundEndSignature OnRoundEnd;

	/** Posición de la simulación convertida a Unreal (cm), con ArenaOrigin. */
	UFUNCTION(BlueprintPure, Category = "JETJump") FVector GetSimLocation() const;
	UFUNCTION(BlueprintPure, Category = "JETJump") FRotator GetSimRotation() const;

	virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;
	virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

private:
	TUniquePtr<FJetRide> Ride;
	TUniquePtr<FJetAutoRider> Auto;
	FJetCourse CourseCopy;
	FJetInput Pending;
	bool bRunning = false, bEnded = false;
	float Accum = 0.f, EndTimer = -1.f;
	void PublishState();
};

/** Funciones de biblioteca para Blueprints: pistas y rivales. */
UCLASS()
class JETJUMPSIM_API UJetSimLibrary : public UBlueprintFunctionLibrary
{
	GENERATED_BODY()
public:
	/** Construye una pista. Height en metros (1.00..1.60), SpeedMPM 325..400. PowerWall > 0 arma la Potencia. */
	UFUNCTION(BlueprintCallable, Category = "JETJump")
	static FJetCourse BuildCourse(EJetLayout Layout, float Height = 1.3f, float SpeedMPM = 375.f, bool bJumpOff = false, int32 Seed = 1, float PowerWall = -1.f);

	/** Simula un rival completo sin render (para la tabla de resultados). Cruise: velocidad de crucero m/s (5.4..7). */
	UFUNCTION(BlueprintCallable, Category = "JETJump")
	static FJetRoundResult SimulateRival(const FJetCourse& Course, const FJetHorseStats& Horse, const FJetRiderSkills& Rider, float Skill, int32 Seed, EJetMode Mode, float Cruise = 6.4f);

	/** Posición Unreal (cm) de un punto de la pista (metros), con origen. */
	UFUNCTION(BlueprintPure, Category = "JETJump")
	static FVector CourseToWorld(float X, float Z, FVector ArenaOrigin, float GroundZ = 0.f);

	UFUNCTION(BlueprintPure, Category = "JETJump")
	static FString FenceTypeName(EJetFenceType Type);
};

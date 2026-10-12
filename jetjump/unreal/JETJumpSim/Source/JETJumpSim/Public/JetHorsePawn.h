// JETJump — Pawn del caballo: malla, cámara con colisión y modos, entrada de teclado y mando.
// Hacer un Blueprint hijo de esta clase, asignar el Skeletal Mesh y el Anim Blueprint (reparentado a UJetHorseAnimInstance).
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"
#include "Animation/AnimInstance.h"
#include "JetRideComponent.h"
#include "JetHorsePawn.generated.h"

class USkeletalMeshComponent;
class USpringArmComponent;
class UCameraComponent;

UENUM(BlueprintType)
enum class EJetCamera : uint8
{
	Chase UMETA(DisplayName = "Seguimiento"),
	Far UMETA(DisplayName = "Lejana"),
	Onboard UMETA(DisplayName = "A bordo"),
	Side UMETA(DisplayName = "Lateral"),
	TV UMETA(DisplayName = "TV"),
};

UCLASS()
class JETJUMPSIM_API AJetHorsePawn : public APawn
{
	GENERATED_BODY()

public:
	AJetHorsePawn();

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "JETJump") USceneComponent* Root;
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "JETJump") USkeletalMeshComponent* Mesh;
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "JETJump") USpringArmComponent* CameraBoom;
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "JETJump") UCameraComponent* Camera;
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "JETJump") UJetRideComponent* Ride;

	/** Altura de la cruz del modelo en cm, para escalar la cámara y el cabeceo. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") float WithersHeightCm = 165.f;
	/** Cabeceo aplicado a la malla durante el salto (1 = el de la simulación). Bajar si el clip de salto ya cabecea. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") float JumpPitchScale = 0.7f;
	/** Giro extra de la malla (grados) si el modelo no mira hacia +X. Un caballo que mira a +Y necesita -90. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") float MeshYawOffset = 0.f;
	/** Altura de la malla respecto al suelo (cm) por si el pivote no está entre los cascos. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") float MeshZOffset = 0.f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") EJetCamera CameraMode = EJetCamera::Chase;

	UFUNCTION(BlueprintCallable, Category = "JETJump") void SetCameraMode(EJetCamera Mode);
	UFUNCTION(BlueprintCallable, Category = "JETJump") void CycleCamera();

	virtual void Tick(float DeltaTime) override;
	virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;

private:
	float KeySteer = 0.f, KeyPace = 0.f, AxisSteer = 0.f, AxisPace = 0.f;
	bool bLeft = false, bRight = false, bUp = false, bDown = false;
	void OnLeft(bool b); void OnRight(bool b); void OnUp(bool b); void OnDown(bool b);
	void OnLeftP() { OnLeft(true); } void OnLeftR() { OnLeft(false); }
	void OnRightP() { OnRight(true); } void OnRightR() { OnRight(false); }
	void OnUpP() { OnUp(true); } void OnUpR() { OnUp(false); }
	void OnDownP() { OnDown(true); } void OnDownR() { OnDown(false); }
	void OnJump();
	void OnCamera();
	void OnRestart();
	void OnAxisSteer(float V) { AxisSteer = V; }
	void OnAxisPace(float V) { AxisPace = -V; }
	void ApplyCamera(float DeltaTime);
	FVector TVLocation = FVector::ZeroVector;
};

/** Reparentar el Animation Blueprint del caballo a esta clase: las variables quedan disponibles en el AnimGraph. */
UCLASS(Blueprintable)
class JETJUMPSIM_API UJetHorseAnimInstance : public UAnimInstance
{
	GENERATED_BODY()
public:
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") float Speed = 0.f;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") float SpeedKmh = 0.f;
	/** 0 parado, 1 paso, 2 trote, 3 galope, 4 galope largo. */
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") int32 Gait = 0;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") float StridePhase = 0.f;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") float StrideFrequency = 0.f;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") int32 Lead = 1;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") bool bJumping = false;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") float JumpProgress = 0.f;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") float TurnRate = 0.f;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") bool bRefusing = false;
	/** Play Rate sugerido para un clip de ciclo de 1 segundo: multiplicar por (1 / duración del clip). */
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") float CyclePlayRate = 1.f;

	virtual void NativeUpdateAnimation(float DeltaSeconds) override;
};

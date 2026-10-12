// JETJump — construye la pista en el mundo a partir de FJetCourse: postes, barras, muros, ría, banderas y números.
// Con las mallas por defecto (formas básicas del motor) ya se juega; asignar mallas propias en el Blueprint para el acabado.
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "JetSimTypes.h"
#include "JetCourseActor.generated.h"

class UStaticMesh;
class UStaticMeshComponent;
class UMaterialInterface;

UCLASS()
class JETJUMPSIM_API AJetCourseActor : public AActor
{
	GENERATED_BODY()
public:
	AJetCourseActor();

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") EJetLayout Layout = EJetLayout::Clasico;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") float Height = 1.3f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") float SpeedMPM = 375.f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") bool bJumpOff = false;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") int32 Seed = 1;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") bool bBuildOnBeginPlay = true;

	/** Mallas opcionales. Vacías = formas básicas del motor (cilindro y cubo de 100 cm). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Mallas") UStaticMesh* RailMesh = nullptr;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Mallas") UStaticMesh* PostMesh = nullptr;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Mallas") UStaticMesh* BlockMesh = nullptr;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Mallas") UMaterialInterface* RailMaterial = nullptr;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Mallas") UMaterialInterface* PostMaterial = nullptr;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Mallas") UMaterialInterface* WaterMaterial = nullptr;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Mallas") UMaterialInterface* GroundLineMaterial = nullptr;

	UPROPERTY(BlueprintReadOnly, Category = "JETJump") FJetCourse Course;

	UFUNCTION(BlueprintCallable, Category = "JETJump") void BuildCourse();
	UFUNCTION(BlueprintCallable, Category = "JETJump") void ClearCourse();
	/** Tira la barra superior del plano indicado (llamar desde OnEvent Knock del componente). */
	UFUNCTION(BlueprintCallable, Category = "JETJump") void KnockRail(int32 Fence, int32 Plane);
	UFUNCTION(BlueprintCallable, Category = "JETJump") void ResetRails();
	UFUNCTION(BlueprintPure, Category = "JETJump") FVector FenceWorldLocation(int32 Fence) const;

	virtual void BeginPlay() override;

private:
	TArray<TArray<TArray<UStaticMeshComponent*>>> TopRails; // [valla][plano][piezas]
	TArray<UStaticMeshComponent*> Pieces;
	UStaticMeshComponent* AddPiece(UStaticMesh* M, UMaterialInterface* Mat, const FVector& Loc, const FRotator& Rot, const FVector& Scale, const FLinearColor& Tint, const FString& Name);
	UStaticMesh* Cylinder = nullptr; UStaticMesh* Cube = nullptr; UStaticMesh* Plane = nullptr;
	UMaterialInterface* BasicMat = nullptr;
};

// JETJump — GameMode listo para jugar: coloca la pista, arranca el recorrido del jugador, tira las barras,
// reproduce sonidos (opcionales) y simula a los rivales para la tabla de resultados.
// Hacer un Blueprint hijo y asignar Default Pawn Class = el Blueprint del caballo (hijo de JetHorsePawn).
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "JetSimTypes.h"
#include "JetRideComponent.h"
#include "JetGameMode.generated.h"

class AJetCourseActor;
class AJetHorsePawn;
class USoundBase;

USTRUCT(BlueprintType)
struct JETJUMPSIM_API FJetRankEntry
{
	GENERATED_BODY()
	UPROPERTY(BlueprintReadOnly) FString Rider;
	UPROPERTY(BlueprintReadOnly) FString Horse;
	UPROPERTY(BlueprintReadOnly) int32 Faults = 0;
	UPROPERTY(BlueprintReadOnly) float Time = 0.f;
	UPROPERTY(BlueprintReadOnly) bool bEliminated = false;
	UPROPERTY(BlueprintReadOnly) bool bPlayer = false;
	UPROPERTY(BlueprintReadOnly) int32 Rank = 0;
};

USTRUCT(BlueprintType)
struct JETJUMPSIM_API FJetHudMessage
{
	GENERATED_BODY()
	UPROPERTY(BlueprintReadOnly) FString Text;
	UPROPERTY(BlueprintReadOnly) float Born = 0.f;
	UPROPERTY(BlueprintReadOnly) FLinearColor Color = FLinearColor::White;
};

UCLASS()
class JETJUMPSIM_API AJetGameMode : public AGameModeBase
{
	GENERATED_BODY()
public:
	AJetGameMode();

	/** Pista a construir si el nivel no trae un JetCourseActor. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Pista") EJetLayout Layout = EJetLayout::Clasico;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Pista", meta = (ClampMin = "0.9", ClampMax = "1.7")) float Height = 1.30f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Pista") float SpeedMPM = 375.f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Pista") bool bJumpOff = false;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Pista") int32 Seed = 7;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Pista") TSubclassOf<AJetCourseActor> CourseActorClass;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Binomio") FString RiderName = TEXT("Vos");
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Binomio") FString HorseName = TEXT("Tormenta");
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Binomio") FJetHorseStats HorseStats;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Binomio") FJetRiderSkills RiderSkills;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Binomio") EJetMode Mode = EJetMode::TableA;
	/** Ayuda: el caballo corrige solo el tranco de batida (recomendado para empezar). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Binomio") bool bAssist = true;
	/** Demo: lo monta la IA (para probar el nivel sin tocar nada). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Binomio") bool bAutoPilot = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Rivales", meta = (ClampMin = "0", ClampMax = "40")) int32 NumRivals = 9;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Rivales") float RivalSkillMin = 0.55f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Rivales") float RivalSkillMax = 0.9f;

	/** Sonidos opcionales (cualquier USoundBase; vacíos = silencio). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Sonido") USoundBase* HoofSound = nullptr;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Sonido") USoundBase* KnockSound = nullptr;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Sonido") USoundBase* RubSound = nullptr;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Sonido") USoundBase* BellSound = nullptr;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Sonido") USoundBase* CheerSound = nullptr;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Sonido") USoundBase* OohSound = nullptr;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Sonido") USoundBase* SplashSound = nullptr;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump|Sonido") USoundBase* SnortSound = nullptr;

	// ---- estado para el HUD y Blueprints
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") AJetCourseActor* CourseActor = nullptr;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") AJetHorsePawn* Horse = nullptr;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") TArray<FJetRankEntry> Ranking;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") TArray<FJetHudMessage> Messages;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") bool bShowResults = false;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") FJetRoundResult PlayerResult;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") int32 PlayerRank = 0;
	UPROPERTY(BlueprintReadOnly, Category = "JETJump") int32 RoundsPlayed = 0;

	UFUNCTION(BlueprintCallable, Category = "JETJump") void StartRound();
	UFUNCTION(BlueprintCallable, Category = "JETJump") void RestartRound();
	UFUNCTION(BlueprintCallable, Category = "JETJump") void PushMessage(const FString& Text, FLinearColor Color);
	UFUNCTION(BlueprintPure, Category = "JETJump") UJetRideComponent* GetRide() const;

	virtual void BeginPlay() override;
	virtual void HandleStartingNewPlayer_Implementation(APlayerController* NewPlayer) override;

protected:
	UFUNCTION() void HandleEvent(const FJetEvent& E);
	UFUNCTION() void HandleRoundEnd(const FJetRoundResult& R);
	void SimulateRivals();
	void ComputeRanking();
	void Play(USoundBase* S, float Volume = 1.f, float Pitch = 1.f) const;
	bool bBound = false;
	bool bWorldBegun = false;
};

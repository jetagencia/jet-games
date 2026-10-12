// JETJump — HUD dibujado con Canvas: próxima valla, trancos, medidor de batida, tiempo, faltas, velocidad,
// mensajes, minimapa y tabla de resultados. Sin assets: funciona en cualquier proyecto.
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "JetHUD.generated.h"

class AJetGameMode;
class UJetRideComponent;
class UFont;

UCLASS()
class JETJUMPSIM_API AJetHUD : public AHUD
{
	GENERATED_BODY()
public:
	AJetHUD();
	virtual void DrawHUD() override;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") bool bShowMinimap = true;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") bool bShowHints = true;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") FLinearColor Accent = FLinearColor(0.98f, 0.76f, 0.2f);
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "JETJump") float Scale = 1.f;

private:
	void Panel(float X, float Y, float W, float H, float Alpha = 0.55f);
	void Label(const FString& T, float X, float Y, float S, const FLinearColor& C, UFont* F = nullptr);
	float Width(const FString& T, float S, UFont* F = nullptr);
	void DrawMinimap(const AJetGameMode* GM, const UJetRideComponent* R, float X, float Y, float W, float H);
	void DrawResults(const AJetGameMode* GM);
	UFont* Big = nullptr; UFont* Mid = nullptr; UFont* Small = nullptr;
	float AskFlash = 0.f;
};

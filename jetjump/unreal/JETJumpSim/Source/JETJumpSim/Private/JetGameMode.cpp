#include "JetGameMode.h"
#include "JetCourseActor.h"
#include "JetHorsePawn.h"
#include "JetHUD.h"
#include "JetSim.h"
#include "EngineUtils.h"
#include "Engine/World.h"
#include "Kismet/GameplayStatics.h"
#include "GameFramework/PlayerController.h"
#include "Sound/SoundBase.h"

static const TCHAR* RIVAL_RIDERS[] = { TEXT("M. Ferreyra"), TEXT("L. Dubois"), TEXT("K. van Houten"), TEXT("S. Brennan"), TEXT("A. Costa"), TEXT("H. Lindqvist"), TEXT("P. Schmidt"), TEXT("R. Tanaka"), TEXT("C. Alvarez"), TEXT("E. O'Neill"), TEXT("J. Moreau"), TEXT("N. Petrov"), TEXT("F. Rossi"), TEXT("D. Nkemelu"), TEXT("V. Ibarra"), TEXT("T. Kowalski") };
static const TCHAR* RIVAL_HORSES[] = { TEXT("Cornet Z"), TEXT("Baloubet"), TEXT("Quidam"), TEXT("Lady Luck"), TEXT("Don Diego"), TEXT("Zafira"), TEXT("Chacco Blue"), TEXT("Hickstead"), TEXT("Nina del Sur"), TEXT("Calvaro"), TEXT("Big Star"), TEXT("Explosion"), TEXT("Sapphire"), TEXT("Tinka's Boy"), TEXT("Milton"), TEXT("Ratina") };

AJetGameMode::AJetGameMode()
{
	DefaultPawnClass = AJetHorsePawn::StaticClass();
	HUDClass = AJetHUD::StaticClass();
	PrimaryActorTick.bCanEverTick = false;
}

void AJetGameMode::BeginPlay()
{
	Super::BeginPlay();
	// pista: la del nivel, o una nueva en el origen
	for (TActorIterator<AJetCourseActor> It(GetWorld()); It; ++It) { CourseActor = *It; break; }
	if (!CourseActor)
	{
		UClass* Cls = CourseActorClass ? CourseActorClass.Get() : AJetCourseActor::StaticClass();
		CourseActor = GetWorld()->SpawnActorDeferred<AJetCourseActor>(Cls, FTransform::Identity);
		if (CourseActor)
		{
			CourseActor->Layout = Layout; CourseActor->Height = Height; CourseActor->SpeedMPM = SpeedMPM; CourseActor->bJumpOff = bJumpOff; CourseActor->Seed = Seed;
			CourseActor->bBuildOnBeginPlay = true;
			UGameplayStatics::FinishSpawningActor(CourseActor, FTransform::Identity);
		}
	}
	bWorldBegun = true;
	if (!Horse) Horse = Cast<AJetHorsePawn>(UGameplayStatics::GetPlayerPawn(this, 0));
	StartRound();
}

void AJetGameMode::HandleStartingNewPlayer_Implementation(APlayerController* NewPlayer)
{
	Super::HandleStartingNewPlayer_Implementation(NewPlayer);
	// el jugador puede entrar antes o después del BeginPlay del mundo: en los dos casos arranca el recorrido
	AJetHorsePawn* P = NewPlayer ? Cast<AJetHorsePawn>(NewPlayer->GetPawn()) : nullptr;
	if (P && P != Horse) { Horse = P; bBound = false; if (bWorldBegun) StartRound(); }
}

UJetRideComponent* AJetGameMode::GetRide() const { return Horse ? Horse->Ride : nullptr; }

void AJetGameMode::StartRound()
{
	if (!CourseActor || !Horse || !Horse->Ride) return;
	if (CourseActor->Course.Fences.Num() == 0) { CourseActor->BuildCourse(); CourseActor->bBuildOnBeginPlay = false; }
	UJetRideComponent* R = Horse->Ride;
	R->ArenaOrigin = CourseActor->GetActorLocation();
	R->GroundZ = 0.f;
	if (!bBound)
	{
		R->OnEvent.AddDynamic(this, &AJetGameMode::HandleEvent);
		R->OnRoundEnd.AddDynamic(this, &AJetGameMode::HandleRoundEnd);
		bBound = true;
	}
	Messages.Reset(); bShowResults = false; PlayerRank = 0;
	RoundsPlayed++;
	R->StartRound(CourseActor->Course, HorseStats, RiderSkills, Mode, Seed * 131 + RoundsPlayed * 17, bAssist, bAutoPilot, 0.8f);
	SimulateRivals();
	PushMessage(FString::Printf(TEXT("%s · %d vallas · %.0f m · TA %.0f s"), *CourseActor->Course.Name, CourseActor->Course.Fences.Num(), CourseActor->Course.Length, CourseActor->Course.TimeAllowed), FLinearColor(0.9f, 0.9f, 0.9f));
}

void AJetGameMode::RestartRound()
{
	if (!CourseActor) return;
	CourseActor->ResetRails();
	StartRound();
}

void AJetGameMode::SimulateRivals()
{
	Ranking.Reset();
	if (!CourseActor) return;
	FRandomStream Rng(Seed * 977 + RoundsPlayed);
	const int32 NR = FMath::Min(NumRivals, 16);
	for (int32 I = 0; I < NR; I++)
	{
		FJetHorseStats H = HorseStats;
		H.Scope = FMath::Clamp(HorseStats.Scope + Rng.FRandRange(-0.12f, 0.12f), 1.1f, 1.75f);
		H.Tech = FMath::Clamp(HorseStats.Tech + Rng.FRandRange(-0.2f, 0.2f), 0.1f, 1.f);
		H.Care = FMath::Clamp(HorseStats.Care + Rng.FRandRange(-0.2f, 0.2f), 0.1f, 1.f);
		H.Speed = FMath::Clamp(HorseStats.Speed + Rng.FRandRange(-0.2f, 0.2f), 0.1f, 1.f);
		H.Bold = FMath::Clamp(HorseStats.Bold + Rng.FRandRange(-0.2f, 0.2f), 0.1f, 1.f);
		FJetRiderSkills S = RiderSkills;
		const float Skill = Rng.FRandRange(RivalSkillMin, RivalSkillMax);
		S.Eye = Skill; S.Balance = Skill; S.Nerve = Skill; S.Turns = Skill;
		const float Cruise = 5.6f + 1.2f * Skill + 0.5f * H.Speed;
		const FJetRoundResult Res = JetSim::SimulateRound(CourseActor->Course, H, S, Skill, Seed * 31 + I * 7 + RoundsPlayed, Mode, Cruise);
		FJetRankEntry E;
		E.Rider = RIVAL_RIDERS[FMath::Abs(I + Seed) % 16]; E.Horse = RIVAL_HORSES[FMath::Abs(I * 5 + Seed) % 16];
		E.Faults = Res.Faults; E.Time = Res.Time; E.bEliminated = Res.bEliminated;
		Ranking.Add(E);
	}
}

void AJetGameMode::ComputeRanking()
{
	// el jugador reemplaza su fila anterior (si la hay) y se ordena por faltas y tiempo; Tabla C solo por tiempo con penalización
	Ranking.RemoveAll([](const FJetRankEntry& E) { return E.bPlayer; });
	FJetRankEntry Me; Me.Rider = RiderName; Me.Horse = HorseName; Me.bPlayer = true;
	Me.Faults = PlayerResult.Faults; Me.Time = PlayerResult.Time; Me.bEliminated = PlayerResult.bEliminated;
	Ranking.Add(Me);
	const bool bTableC = Mode == EJetMode::TableC;
	Ranking.Sort([bTableC](const FJetRankEntry& A, const FJetRankEntry& B)
	{
		if (A.bEliminated != B.bEliminated) return !A.bEliminated;
		if (bTableC) return A.Time < B.Time;
		if (A.Faults != B.Faults) return A.Faults < B.Faults;
		return A.Time < B.Time;
	});
	for (int32 I = 0; I < Ranking.Num(); I++) { Ranking[I].Rank = I + 1; if (Ranking[I].bPlayer) PlayerRank = I + 1; }
}

void AJetGameMode::PushMessage(const FString& Text, FLinearColor Color)
{
	FJetHudMessage M; M.Text = Text; M.Color = Color; M.Born = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.f;
	Messages.Add(M);
	if (Messages.Num() > 6) Messages.RemoveAt(0);
}

void AJetGameMode::Play(USoundBase* S, float Volume, float Pitch) const
{
	if (!S || !Horse) return;
	UGameplayStatics::PlaySoundAtLocation(this, S, Horse->GetActorLocation(), Volume, Pitch);
}

void AJetGameMode::HandleEvent(const FJetEvent& E)
{
	const FLinearColor Red(1.f, 0.35f, 0.3f), Gold(1.f, 0.85f, 0.3f), Green(0.5f, 1.f, 0.5f), Blue(0.5f, 0.8f, 1.f);
	const float Speed = Horse && Horse->Ride ? Horse->Ride->Speed : 0.f;
	switch (E.Type)
	{
	case EJetEvent::Start: Play(BellSound); PushMessage(TEXT("¡Campana! Adelante"), Gold); break;
	case EJetEvent::Hoof: Play(HoofSound, FMath::Clamp(0.25f + Speed / 12.f, 0.25f, 1.f), FMath::FRandRange(0.92f, 1.08f)); break;
	case EJetEvent::Knock:
		if (CourseActor) CourseActor->KnockRail(E.Fence, E.Plane);
		Play(KnockSound); Play(OohSound, 0.7f);
		PushMessage(Mode == EJetMode::TableC ? TEXT("¡Barra! +4 s") : TEXT("¡Barra! 4 faltas"), Red);
		break;
	case EJetEvent::Rub: Play(RubSound, 0.6f); break;
	case EJetEvent::Water: Play(SplashSound); PushMessage(TEXT("Pie en el agua: 4 faltas"), Red); break;
	case EJetEvent::Refusal: Play(SnortSound); Play(OohSound, 0.5f); PushMessage(FString::Printf(TEXT("%s · 4 faltas (desobediencia %d de 2)"), E.Text.IsEmpty() ? TEXT("Rehúse") : *E.Text, (int32)E.Value), Red); break;
	case EJetEvent::Fall: Play(OohSound); PushMessage(TEXT("Caída"), Red); break;
	case EJetEvent::Takeoff:
		Play(SnortSound, 0.5f);
		if (E.Spot == EJetSpot::Perfect) PushMessage(TEXT("Batida perfecta"), Green);
		else PushMessage(E.Spot == EJetSpot::Long ? TEXT("Batida larga") : TEXT("Batida profunda"), FLinearColor(0.9f, 0.9f, 0.6f));
		break;
	case EJetEvent::Cleared:
		if (E.Value < 0.5f && Horse && Horse->Ride && Horse->Ride->GetNextFence() >= CourseActor->Course.Fences.Num()) PushMessage(TEXT("¡Última limpia! A la llegada"), Green);
		break;
	case EJetEvent::Feedback: if (!E.Text.IsEmpty()) PushMessage(E.Text, Blue); break;
	case EJetEvent::Finish:
		Play(CheerSound);
		PushMessage(FString::Printf(TEXT("¡Llegada! %.2f s"), E.Value), Gold);
		break;
	case EJetEvent::Eliminated: Play(OohSound); PushMessage(FString::Printf(TEXT("Eliminado: %s"), *E.Text), Red); break;
	default: break;
	}
}

void AJetGameMode::HandleRoundEnd(const FJetRoundResult& R)
{
	PlayerResult = R;
	ComputeRanking();
	bShowResults = true;
}

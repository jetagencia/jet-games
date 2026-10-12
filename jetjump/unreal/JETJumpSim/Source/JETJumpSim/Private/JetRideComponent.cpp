#include "JetRideComponent.h"
#include "JetSim.h"
#include "GameFramework/Actor.h"

UJetRideComponent::UJetRideComponent()
{
	PrimaryComponentTick.bCanEverTick = true;
	PrimaryComponentTick.TickGroup = TG_PrePhysics;
}

void UJetRideComponent::StartRound(const FJetCourse& Course, const FJetHorseStats& Horse, const FJetRiderSkills& Rider, EJetMode Mode, int32 Seed, bool bAssist, bool bAutoPilot, float AutoSkill)
{
	CourseCopy = Course;
	Ride = MakeUnique<FJetRide>(Course, Horse, Rider, Mode, Seed, bAssist);
	Auto.Reset();
	if (bAutoPilot) Auto = MakeUnique<FJetAutoRider>(*Ride, AutoSkill, Seed, 5.4f + 1.0f * AutoSkill + 0.6f * Horse.Speed);
	Pending = FJetInput();
	bRunning = true; bEnded = false; Accum = 0.f; EndTimer = -1.f;
	PublishState();
	if (bDriveOwnerTransform && GetOwner()) GetOwner()->SetActorLocationAndRotation(GetSimLocation(), GetSimRotation(), false, nullptr, ETeleportType::TeleportPhysics);
}

void UJetRideComponent::StopRound() { bRunning = false; }

void UJetRideComponent::SetInput(float Steer, float Pace, bool bJump)
{
	Pending.Steer = FMath::Clamp(Steer, -1.f, 1.f);
	Pending.Pace = FMath::Clamp(Pace, -1.f, 1.f);
	if (bJump) Pending.bJump = true;
}

void UJetRideComponent::AskJump() { Pending.bJump = true; }

void UJetRideComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
	Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
	if (!bRunning || !Ride) return;
	const float Dt = 1.f / FMath::Max(30, SubstepsPerSecond);
	Accum += FMath::Min(DeltaTime, 0.1f);
	TArray<FJetEvent> Collected;
	while (Accum >= Dt)
	{
		Accum -= Dt;
		FJetInput In = Auto ? Auto->Input(Dt) : Pending;
		Ride->Step(Dt, In);
		Pending.bJump = false;
		Collected.Append(Ride->Events);
	}
	for (const FJetEvent& E : Collected)
	{
		OnEvent.Broadcast(E);
		if (E.Type == EJetEvent::Finish || E.Type == EJetEvent::Eliminated) EndTimer = 3.2f;
	}
	PublishState();
	if (bDriveOwnerTransform && GetOwner()) GetOwner()->SetActorLocationAndRotation(GetSimLocation(), GetSimRotation(), false, nullptr, ETeleportType::None);
	if (EndTimer >= 0.f)
	{
		EndTimer -= DeltaTime;
		if (EndTimer <= 0.f && !bEnded) { bEnded = true; bRunning = false; OnRoundEnd.Broadcast(GetResult()); }
	}
}

void UJetRideComponent::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
	Auto.Reset(); Ride.Reset();
	Super::EndPlay(EndPlayReason);
}

void UJetRideComponent::PublishState()
{
	if (!Ride) return;
	Speed = Ride->V; SpeedKmh = Ride->V * 3.6f;
	Gait = (EJetGait)FMath::Clamp(Ride->Gait, 0, 4);
	StridePhase = Ride->Phase;
	StrideFrequency = Ride->Gait >= 1 ? JetSim::StrideFreq(Ride->Gait, FMath::Max(Ride->V, 0.5f)) / Ride->StrideScale : 0.f;
	Lead = Ride->Lead;
	bJumping = Ride->bJumping;
	JumpProgress = Ride->bJumping ? FMath::Clamp(Ride->Jump.T / Ride->Jump.Dur, 0.f, 1.f) : 0.f;
	HeightAboveGround = Ride->Y - JetSim::Y0;
	PitchRad = Ride->Pitch; RollRad = Ride->Roll; TurnRate = Ride->Omega;
	bRefusing = Ride->bRefusing; Stamina = Ride->Stamina;
}

FVector UJetRideComponent::GetSimLocation() const
{
	if (!Ride) return ArenaOrigin;
	return ArenaOrigin + FVector(Ride->X * JetSim::MetersToCm, Ride->Z * JetSim::MetersToCm, GroundZ + (Ride->Y - JetSim::Y0) * JetSim::MetersToCm);
}

FRotator UJetRideComponent::GetSimRotation() const
{
	if (!Ride) return FRotator::ZeroRotator;
	// Yaw = heading; el cabeceo del salto se deja al Animation Blueprint (PitchRad) para no romper la cápsula.
	return FRotator(0.f, FMath::RadiansToDegrees(Ride->Heading), 0.f);
}

FJetApproach UJetRideComponent::GetApproach() const { return Ride ? Ride->Approach() : FJetApproach(); }
int32 UJetRideComponent::GetFaults() const { return Ride ? Ride->Faults() : 0; }
int32 UJetRideComponent::GetTimeFaults() const { return Ride ? Ride->TimeFaults() : 0; }
float UJetRideComponent::GetTime() const { return Ride ? Ride->Time : 0.f; }
float UJetRideComponent::GetCountdownLeft() const { return Ride && !Ride->bStarted ? FMath::Max(0.f, Ride->Countdown - Ride->Clock) : 0.f; }
int32 UJetRideComponent::GetNextFence() const { return Ride ? Ride->Next : 0; }

FJetRoundResult UJetRideComponent::GetResult() const
{
	FJetRoundResult R;
	if (!Ride) return R;
	R.Faults = Ride->Faults(); R.Time = Ride->Time; R.ScoreTime = Ride->ScoreTime(); R.Rails = Ride->StatRails; R.Refusals = Ride->Disobediences;
	R.bEliminated = Ride->bEliminated; R.EliminationReason = Ride->Elimination;
	return R;
}

// ---------------------------------------------------------------- biblioteca
FJetCourse UJetSimLibrary::BuildCourse(EJetLayout Layout, float Height, float SpeedMPM, bool bJumpOff, int32 Seed, float PowerWall)
{
	return JetSim::BuildCourse(Layout, Height, SpeedMPM, bJumpOff, Seed, PowerWall);
}

FJetRoundResult UJetSimLibrary::SimulateRival(const FJetCourse& Course, const FJetHorseStats& Horse, const FJetRiderSkills& Rider, float Skill, int32 Seed, EJetMode Mode, float Cruise)
{
	return JetSim::SimulateRound(Course, Horse, Rider, Skill, Seed, Mode, Cruise);
}

FVector UJetSimLibrary::CourseToWorld(float X, float Z, FVector ArenaOrigin, float GroundZ)
{
	return ArenaOrigin + FVector(X * JetSim::MetersToCm, Z * JetSim::MetersToCm, GroundZ);
}

FString UJetSimLibrary::FenceTypeName(EJetFenceType Type)
{
	switch (Type)
	{
	case EJetFenceType::Oxer: return TEXT("Oxer");
	case EJetFenceType::TripleBar: return TEXT("Triple barra");
	case EJetFenceType::Wall: return TEXT("Muro");
	case EJetFenceType::Liverpool: return TEXT("Liverpool");
	case EJetFenceType::Water: return TEXT("Ría");
	case EJetFenceType::Gate: return TEXT("Vertical con tranquera");
	default: return TEXT("Vertical");
	}
}

// JETJump — núcleo de la simulación en C++ puro (sin UObjects), portado del motor web calibrado.
#pragma once

#include "CoreMinimal.h"
#include "JetSimTypes.h"

namespace JetSim
{
	JETJUMPSIM_API float StrideFreq(int32 Gait, float V);
	JETJUMPSIM_API float PaceToSpeed(float P, float Top);
	JETJUMPSIM_API float SpeedToPace(float V, float Top);
	/** Fase (0..1) del apoyo de cada miembro [MA, MD, PA, PD] para un aire y un pie (lead +1 derecho, -1 izquierdo). */
	JETJUMPSIM_API void FootOffsets(int32 Gait, int32 Lead, float Out[4]);
	JETJUMPSIM_API float Duty(int32 Gait);

	struct FJumpProfile { float U, TUp, T, Len, Pitch; };
	struct FPlaneEval { float C, Front, Hind, X; };
	struct FJumpSolution { float H = 0.25f; FJumpProfile Prof{}; TArray<FPlaneEval> Planes; float Min = 0.f; bool bWet = false; float HMax = 0.f; };

	JETJUMPSIM_API FJumpProfile JumpProfile(float V, float H, float Tech);
	JETJUMPSIM_API FJumpSolution SolveJump(float V, float D, float CosA, const FJetFence& Fence, const FJetHorseStats& Stats, float Power);
	JETJUMPSIM_API float IdealTakeoff(const FJetFence& Fence, float V, const FJetHorseStats& Stats, float Power);

	/** Construye una pista a partir de un diseño. */
	JETJUMPSIM_API FJetCourse BuildCourse(EJetLayout Layout, float Height, float SpeedMPM, bool bJumpOff, int32 Seed, float PowerWall = -1.f);
}

/** Un binomio recorriendo una pista. Determinista si se le da una semilla. */
class JETJUMPSIM_API FJetRide
{
public:
	FJetRide(const FJetCourse& InCourse, const FJetHorseStats& InHorse, const FJetRiderSkills& InRider, EJetMode InMode, int32 Seed, bool bInAssist);

	void Step(float Dt, const FJetInput& In);

	// Estado
	float X = 0, Z = 0, Y = JetSim::Y0, Heading = 0, V = 0, Pace = 0, Top = 10;
	int32 Gait = 0, Lead = 1, Next = 0;
	float Phase = 0, StrideScale = 1, Omega = 0, WrongLeadT = 0, Stamina = 1;
	float Pitch = 0, Roll = 0;
	int32 JumpFaults = 0, Disobediences = 0;
	float Time = 0, Clock = 0, Countdown = 45;
	bool bStarted = false, bFinished = false, bTraining = false, bAssist = false;
	FString Elimination;
	bool bEliminated = false;
	// Salto en curso
	bool bJumping = false;
	struct FKnock { int32 Plane; float T; float C; bool bDown; bool bFront; bool bDone; };
	struct FJump { int32 Fence; float T, Dur, U, H, TUp, PitchAmp, X0, Z0, Hx, Hz, V0, D, Ideal; bool bWet, bCrash; int32 LandLead; EJetSpot Spot; TArray<FKnock> Knocks; } Jump;
	// Rehúse en curso
	bool bRefusing = false; float RefuseT = 0; int32 Lock = -1; float AskT = -99.f, LastRefuseT = -99.f; bool bWrongFence = false;
	TSet<int32> DownFences;
	TArray<FJetEvent> Events;
	int32 StatJumps = 0, StatRails = 0, StatPerfect = 0, StatLong = 0, StatDeep = 0;

	int32 TimeFaults() const;
	int32 Faults() const { return JumpFaults + TimeFaults(); }
	float ScoreTime() const;
	float Power() const;
	float StrideLen() const;
	FJetApproach Approach() const;
	float IdealFor(const FJetFence& E, float Vel) const;
	void Local(const FJetFence& E, float Px, float Pz, float& A, float& B) const;
	const FJetCourse& GetCourse() const { return Course; }
	float Rand() { return Rng.FRand(); }

private:
	FJetCourse Course;
	FJetHorseStats Horse;
	FJetRiderSkills Rider;
	EJetMode Mode;
	FRandomStream Rng;
	mutable TMap<int32, float> IdealCache;
	float PrevX = 0, PrevZ = 0; bool bHavePrev = false;

	void Emit(EJetEvent Type, int32 Fence = -1, int32 Plane = -1, float Value = 0.f, const FString& Text = FString(), EJetSpot Spot = EJetSpot::Perfect, int32 Leg = -1);
	void Eliminate(const FString& Reason);
	void StepGround(float Dt, const FJetInput& In);
	void GroundMove(float Dt, float Steer, float PaceDelta, bool bLocked);
	void MoveTo(float Nx, float Nz, float Dt);
	void OnBoundary();
	void JumpLogic();
	struct FCandidate { const FJetFence* E = nullptr; float D = 0, CosA = 1, Bp = 0; };
	FCandidate Candidate() const;
	void DoRefusal(const FJetFence& E, const FString& Kind);
	void Takeoff(const FJetFence& E, float D, float CosA, float Support, const FString& How);
	void StepJump(float Dt, const FJetInput& In);
	void Land();
	void Lines();
	void UpdatePose(float Dt);
};

/** Piloto automático: rivales simulados y pruebas. */
class JETJUMPSIM_API FJetAutoRider
{
public:
	FJetAutoRider(FJetRide& InRide, float InSkill, int32 Seed, float InCruise = 6.4f);
	FJetInput Input(float Dt);

private:
	struct FWaypoint { float X, Z, R; int32 Fence; int32 Kind; }; // Kind: 0 start, 1 pre, 2 app, 3 fence, 4 land, 5 finish, 6 detour
	FJetRide& Ride;
	float Skill, Cruise, Noise = 0, LastVT = -1, AskAt = -1;
	int32 Wp = 0, Asked = -1, PlanEl = -1, PlanK = -1;
	FRandomStream Rng;
	TArray<FWaypoint> Path;
	void BuildPath();
};

namespace JetSim
{
	JETJUMPSIM_API float PathLength(const FJetCourse& Course);
	/** Simula un recorrido completo sin render. */
	JETJUMPSIM_API FJetRoundResult SimulateRound(const FJetCourse& Course, const FJetHorseStats& Horse, const FJetRiderSkills& Rider, float Skill, int32 Seed, EJetMode Mode, float Cruise);
}

// JETJump — núcleo de la simulación. Portado 1:1 de jetjump/src/sim.js y courses.js (calibrado con 90 recorridos por configuración).
#include "JetSim.h"

using namespace JetSim;

// ------------------------------------------------------------------ aires
static const float FOOT[5][4] = {
	{0, 0, 0, 0},
	{0.25f, 0.75f, 0.0f, 0.5f},
	{0.0f, 0.5f, 0.5f, 0.0f},
	{0.28f, 0.48f, 0.0f, 0.24f},
	{0.42f, 0.55f, 0.0f, 0.12f},
};
static const float DUTY[5] = { 0, 0.62f, 0.42f, 0.40f, 0.30f };

float JetSim::Duty(int32 Gait) { return DUTY[FMath::Clamp(Gait, 0, 4)]; }

void JetSim::FootOffsets(int32 Gait, int32 Lead, float Out[4])
{
	const float* O = FOOT[FMath::Clamp(Gait, 0, 4)];
	if (Lead > 0 || Gait < 3) { for (int i = 0; i < 4; i++) Out[i] = O[i]; return; }
	Out[0] = O[1]; Out[1] = O[0]; Out[2] = O[3]; Out[3] = O[2];
}

float JetSim::StrideFreq(int32 G, float V)
{
	switch (G)
	{
	case 1: return 0.9f + 0.05f * V;
	case 2: return 1.3f + 0.04f * V;
	case 3: return 1.45f + 0.045f * V;
	case 4: return 1.7f + 0.045f * V;
	default: return 0.f;
	}
}

static const float PACE_PTS[6][2] = { {0, 0}, {0.1f, 1.6f}, {0.25f, 3.4f}, {0.38f, 4.6f}, {0.8f, 8.0f}, {1, 0} };

float JetSim::PaceToSpeed(float P, float Top)
{
	for (int i = 1; i < 6; i++)
	{
		const float P1 = PACE_PTS[i][0], S1 = i == 5 ? Top : PACE_PTS[i][1];
		if (P <= P1) { const float P0 = PACE_PTS[i - 1][0], S0 = PACE_PTS[i - 1][1]; return FMath::Lerp(S0, S1, (P - P0) / (P1 - P0)); }
	}
	return Top;
}

float JetSim::SpeedToPace(float V, float Top)
{
	for (int i = 1; i < 6; i++)
	{
		const float P1 = PACE_PTS[i][0], S1 = i == 5 ? Top : PACE_PTS[i][1];
		if (V <= S1) { const float P0 = PACE_PTS[i - 1][0], S0 = PACE_PTS[i - 1][1]; return FMath::Lerp(P0, P1, (V - S0) / FMath::Max(S1 - S0, 1e-4f)); }
	}
	return 1.f;
}

// ------------------------------------------------------------------ salto
FJumpProfile JetSim::JumpProfile(float V, float H, float Tech)
{
	FJumpProfile P;
	P.U = V * 0.84f + 0.7f;
	P.TUp = FMath::Sqrt(2 * H / G);
	P.T = 2 * P.TUp;
	P.Len = P.U * P.T;
	P.Pitch = 0.26f + 0.12f * Tech;
	return P;
}

static float ComAt(float X, float U, float H, float TUp) { const float Dx = X / U - TUp; return Y0 + H - 0.5f * G * Dx * Dx; }

static void EvalClearance(const FJumpProfile& Prof, float H, float D, float CosA, const TArray<FJetPlane>& Planes, float Tech, TArray<FPlaneEval>& Out, float& Min)
{
	const float DropF = 0.60f - 0.13f * Tech, DropH = 0.70f - 0.15f * Tech;
	Out.Reset(); Min = TNumericLimits<float>::Max();
	for (const FJetPlane& P : Planes)
	{
		const float X = (D + P.Offset) / CosA;
		const float Xf = X - 0.85f;
		const float Pf = Prof.Pitch * FMath::Cos(PI * Clamp(Xf / Prof.Len, 0, 1));
		const float YF = ComAt(Xf, Prof.U, H, Prof.TUp) + 0.85f * FMath::Sin(Pf) - DropF;
		const float Xh = X + 1.0f;
		const float Ph = Prof.Pitch * FMath::Cos(PI * Clamp(Xh / Prof.Len, 0, 1));
		const float YH = ComAt(Xh, Prof.U, H, Prof.TUp) - 1.0f * FMath::Sin(Ph) - DropH;
		FPlaneEval E; E.C = FMath::Min(YF, YH) - P.Height; E.Front = YF - P.Height; E.Hind = YH - P.Height; E.X = X;
		Out.Add(E);
		if (E.C < Min) Min = E.C;
	}
}

static float MaxRise(const FJetHorseStats& S, float V, float Power)
{
	const float Imp = Clamp(0.62f + 0.065f * V, 0.7f, 1.12f);
	return FMath::Max(0.3f, (1.27f * S.Scope - 0.79f) * Imp * Power);
}

FJumpSolution JetSim::SolveJump(float V, float D, float CosA, const FJetFence& Fence, const FJetHorseStats& Stats, float Power)
{
	const float Tech = Stats.Tech;
	const float HMax = MaxRise(Stats, V, Power);
	const float Margin = 0.03f + 0.09f * Stats.Care;
	auto IsWet = [&](const FJumpProfile& Prof) { return Fence.bWater ? (Prof.Len - 0.55f) < (D + Fence.WaterEnd) / CosA : false; };
	FJumpSolution Best; bool bHave = false; float BestScore = -TNumericLimits<float>::Max();
	TArray<FPlaneEval> Ev; float Min;
	for (float H = 0.25f; H <= HMax + 1e-6f; H += 0.01f)
	{
		const FJumpProfile Prof = JumpProfile(V, H, Tech);
		EvalClearance(Prof, H, D, CosA, Fence.Planes, Tech, Ev, Min);
		const bool bWet = IsWet(Prof);
		const float Score = Min - (bWet ? 0.3f : 0.f);
		if (!bHave || Score > BestScore) { bHave = true; BestScore = Score; Best.H = H; Best.Prof = Prof; Best.Planes = Ev; Best.Min = Min; Best.bWet = bWet; }
		if (Min >= Margin && !bWet) { Best.H = H; Best.Prof = Prof; Best.Planes = Ev; Best.Min = Min; Best.bWet = bWet; break; }
	}
	if (!bHave)
	{
		Best.H = 0.25f; Best.Prof = JumpProfile(V, 0.25f, Tech);
		EvalClearance(Best.Prof, 0.25f, D, CosA, Fence.Planes, Tech, Best.Planes, Best.Min); Best.bWet = IsWet(Best.Prof);
	}
	Best.HMax = HMax;
	return Best;
}

float JetSim::IdealTakeoff(const FJetFence& Fence, float V, const FJetHorseStats& Stats, float Power)
{
	float BestD = 2.f, BestC = -TNumericLimits<float>::Max();
	FJetFence Dry = Fence; Dry.bWater = false;
	for (float D = 0.5f; D <= 3.8f; D += 0.05f)
	{
		const FJumpSolution S = SolveJump(V, D, 1.f, Dry, Stats, Power);
		const float Score = S.Min - 0.02f * FMath::Abs(D - 2.f);
		if (Score > BestC) { BestC = Score; BestD = D; }
	}
	return BestD;
}

// ------------------------------------------------------------------ pistas
namespace
{
	struct FLayoutFence { EJetFenceType T; float X, Z, Deg; float Dist; bool bCombo; };
	struct FLayout { const TCHAR* Name; float W, H; bool bIndoor; float SX, SZ, SDeg, FX, FZ, FDeg; TArray<TArray<FLayoutFence>> Fences; TArray<int32> JumpOff; };

	FLayoutFence F(EJetFenceType T, float X, float Z, float Deg) { return { T, X, Z, Deg, 0, false }; }
	FLayoutFence C(EJetFenceType T, float Dist) { return { T, 0, 0, 0, Dist, true }; }

	const FLayout& GetLayout(EJetLayout L)
	{
		using E = EJetFenceType;
		static FLayout Clasico = { TEXT("Clásico"), 96, 64, false, -36, -24, 0, 24, 22, 90, {
			{F(E::Vertical, -22, -24, 0)}, {F(E::Oxer, 0, -24, 0)}, {F(E::TripleBar, 36, 0, 90)}, {F(E::Gate, 36, 16, 90)},
			{F(E::Oxer, 12, 26, 180), C(E::Vertical, 7.8f)}, {F(E::Wall, -38, 6, 270)}, {F(E::Oxer, -16, -11, 0)}, {F(E::Liverpool, 4, -11, 0)},
			{F(E::Vertical, 24, 2, 90), C(E::Oxer, 7.8f)} }, {0, 2, 3, 6, 8, 9, 10} };
		static FLayout Rio = { TEXT("Gran Premio"), 96, 64, false, -40, 24, 270, -26, 16, 180, {
			{F(E::Vertical, -40, 8, 270)}, {F(E::Oxer, -20, -24, 0)}, {F(E::Water, 4, -25, 0)}, {F(E::Vertical, 38, -4, 90)},
			{F(E::Oxer, 16, 26, 180), C(E::Vertical, 7.9f)}, {F(E::TripleBar, -16, 26, 180)}, {F(E::Gate, -30, 2, 270)},
			{F(E::Vertical, -12, -9, 0), C(E::Oxer, 10.8f)}, {F(E::Wall, 22, 2, 60)}, {F(E::Oxer, 14, 15, 180), C(E::Vertical, 7.8f), C(E::Oxer, 10.7f)} }, {0, 2, 3, 4, 5, 7, 10, 11, 12, 13} };
		static FLayout Indoor = { TEXT("Indoor"), 74, 44, true, -28, -17, 0, 24, -6, 0, {
			{F(E::Oxer, -14, -17, 0)}, {F(E::Vertical, 8, -17, 0)}, {F(E::Wall, 30, 1, 90)}, {F(E::Oxer, 12, 17, 180)}, {F(E::Gate, -8, 17, 180)},
			{F(E::TripleBar, -30, 6, 270)}, {F(E::Vertical, -12, -6, 0), C(E::Oxer, 7.7f)}, {F(E::Liverpool, 14, -6, 0)} }, {0, 2, 3, 5, 6, 7, 8} };
		switch (L) { case EJetLayout::GranPremio: return Rio; case EJetLayout::Indoor: return Indoor; default: return Clasico; }
	}

	void PlanesFor(EJetFenceType T, float H, FJetFence& Out)
	{
		Out.Planes.Reset(); Out.bWater = false;
		switch (T)
		{
		case EJetFenceType::Oxer: { const float S = FMath::Min(FMath::Max(H * 0.95f + 0.05f, 1.0f), 1.9f); Out.Planes.Add({0, H - 0.05f}); Out.Planes.Add({S, H}); Out.Spread = S; break; }
		case EJetFenceType::TripleBar: { const float S = FMath::Min(H + 0.45f, 2.2f); Out.Planes.Add({0, H - 0.35f}); Out.Planes.Add({S / 2, H - 0.15f}); Out.Planes.Add({S, H}); Out.Spread = S; break; }
		case EJetFenceType::Wall: Out.Planes.Add({0.22f, H}); Out.Spread = 0.45f; break;
		case EJetFenceType::Liverpool: Out.Planes.Add({0.9f, H}); Out.Spread = 1.8f; break;
		case EJetFenceType::Water: { const float W = FMath::Min(3.0f + (H - 1.2f) * 2.5f, 4.2f); Out.Planes.Add({0, 0.5f}); Out.Spread = 0.3f; Out.bWater = true; Out.WaterStart = 0.3f; Out.WaterEnd = W; break; }
		default: Out.Planes.Add({0, H}); Out.Spread = 0; break;
		}
	}

	void FinishFence(FJetFence& E)
	{
		E.WorldLocation = ToUE(E.X, 0, E.Z);
		E.WorldRotation = YawToUE(E.Heading);
	}
}

FJetCourse JetSim::BuildCourse(EJetLayout LayoutKey, float Height, float SpeedMPM, bool bJumpOff, int32 Seed, float PowerWall)
{
	const FLayout& L = GetLayout(LayoutKey);
	FJetCourse Course;
	Course.Layout = LayoutKey; Course.Name = L.Name; Course.ArenaWidth = L.W; Course.ArenaDepth = L.H; Course.bIndoor = L.bIndoor;
	Course.Height = Height; Course.SpeedMPM = SpeedMPM; Course.bJumpOff = bJumpOff;
	TArray<FJetFence> Els;
	int32 Num = 0;
	for (int32 Fi = 0; Fi < L.Fences.Num(); Fi++)
	{
		Num++;
		const TArray<FLayoutFence>& Parts = L.Fences[Fi];
		const int32 ComboStart = Els.Num();
		const FJetFence* Prev = nullptr;
		for (int32 K = 0; K < Parts.Num(); K++)
		{
			const FLayoutFence& P = Parts[K];
			FJetFence E;
			const float Deg = P.bCombo ? Prev->Heading * 180.f / PI : P.Deg;
			E.Heading = Deg * PI / 180.f;
			const FVector2D N = E.N();
			if (Prev) { const float Back = Prev->Spread + (Prev->bWater ? Prev->WaterEnd - Prev->Spread : 0); E.X = Prev->X + N.X * (Back + P.Dist); E.Z = Prev->Z + N.Y * (Back + P.Dist); }
			else { E.X = P.X; E.Z = P.Z; }
			float H = Height;
			if (Fi == 0) H = Height - 0.1f;
			if (P.T == EJetFenceType::Water) H = Height;
			if (P.T == EJetFenceType::TripleBar) H = Height + 0.03f;
			E.Type = P.T; E.Height = H; E.HalfWidth = 1.75f;
			PlanesFor(P.T, H, E);
			E.Index = Els.Num(); E.Number = Num; E.Label = Parts.Num() > 1 ? FString::Printf(TEXT("%d%c"), Num, TEXT("abc")[K]) : FString::FromInt(Num);
			E.ComboStart = ComboStart; E.ComboPos = K; E.ComboLen = Parts.Num(); E.Scheme = (Fi * 3 + Seed) % 8;
			FinishFence(E);
			Els.Add(E);
			Prev = &Els.Last();
		}
	}
	TArray<FJetFence> Elements = Els;
	float SX = L.SX, SZ = L.SZ, SDeg = L.SDeg, FX = L.FX, FZ = L.FZ, FDeg = L.FDeg;
	if (bJumpOff && L.JumpOff.Num())
	{
		Elements.Reset();
		for (int32 I : L.JumpOff) Elements.Add(Els[I]);
		// renumerar y reconstruir combinaciones
		TArray<int32> NewStart; NewStart.SetNum(Elements.Num());
		int32 LastNum = -1;
		for (int32 I = 0; I < Elements.Num(); I++) { if (Elements[I].Number != LastNum) { LastNum = Elements[I].Number; NewStart[I] = I; } else NewStart[I] = NewStart[I - 1]; Elements[I].Index = I; }
		int32 NN = 0;
		for (int32 I = 0; I < Elements.Num(); I++)
		{
			if (NewStart[I] == I) NN++;
			int32 Len = 0, Pos = 0; for (int32 J = 0; J < Elements.Num(); J++) if (NewStart[J] == NewStart[I]) { if (J < I) Pos++; Len++; }
			FJetFence& E = Elements[I];
			E.ComboStart = NewStart[I]; E.ComboPos = Pos; E.ComboLen = Len; E.Number = NN;
			E.Label = Len > 1 ? FString::Printf(TEXT("%d%c"), NN, TEXT("abc")[Pos]) : FString::FromInt(NN);
			E.Height += 0.05f; for (FJetPlane& P : E.Planes) P.Height += 0.05f;
		}
	}
	if (PowerWall > 0)
	{
		Elements.Reset();
		FJetFence E; E.Type = EJetFenceType::Wall; E.X = 0; E.Z = 0; E.Heading = 0; E.Height = PowerWall; E.HalfWidth = 1.75f;
		PlanesFor(EJetFenceType::Wall, PowerWall, E); E.Index = 0; E.Number = 1; E.Label = TEXT("1"); E.ComboStart = 0; E.ComboPos = 0; E.ComboLen = 1; FinishFence(E);
		Elements.Add(E);
		SX = -22; SZ = 0; SDeg = 0; FX = 14; FZ = 0; FDeg = 0;
	}
	auto MkLine = [](float X, float Z, float Deg) { FJetLine Ln; Ln.X = X; Ln.Z = Z; Ln.Heading = Deg * PI / 180.f; Ln.HalfWidth = 4.f; Ln.WorldLocation = ToUE(X, 0, Z); Ln.WorldRotation = YawToUE(Ln.Heading); return Ln; };
	Course.Fences = Elements;
	Course.Start = MkLine(SX, SZ, SDeg);
	Course.Finish = MkLine(FX, FZ, FDeg);
	const float Len = PathLength(Course);
	Course.Length = FMath::RoundToFloat(Len / 5.f) * 5.f;
	Course.TimeAllowed = PowerWall > 0 ? 0.f : FMath::CeilToFloat(Course.Length / (SpeedMPM / 60.f));
	if (bJumpOff) Course.TimeAllowed = FMath::CeilToFloat(Course.TimeAllowed * 0.8f);
	Course.TimeLimit = PowerWall > 0 ? 120.f : Course.TimeAllowed * 2.f;
	return Course;
}

// ------------------------------------------------------------------ Ride
FJetRide::FJetRide(const FJetCourse& InCourse, const FJetHorseStats& InHorse, const FJetRiderSkills& InRider, EJetMode InMode, int32 Seed, bool bInAssist)
	: Course(InCourse), Horse(InHorse), Rider(InRider), Mode(InMode), Rng(Seed)
{
	bAssist = bInAssist;
	bTraining = Mode == EJetMode::Training;
	Countdown = bTraining ? 0.f : 45.f;
	const FJetLine& St = Course.Start;
	X = St.X - FMath::Cos(St.Heading) * 7.f; Z = St.Z - FMath::Sin(St.Heading) * 7.f;
	X = Clamp(X, -Course.ArenaWidth / 2 + 2.5f, Course.ArenaWidth / 2 - 2.5f); Z = Clamp(Z, -Course.ArenaDepth / 2 + 2.5f, Course.ArenaDepth / 2 - 2.5f);
	Heading = St.Heading;
	Top = 9.4f + 2.6f * Horse.Speed;
	Pace = 0; Gait = 0;
	Stamina = Clamp(Horse.Fitness, 0.3f, 1.f);
	bStarted = bTraining;
}

void FJetRide::Emit(EJetEvent Type, int32 Fence, int32 Plane, float Value, const FString& Text, EJetSpot Spot, int32 Leg)
{
	FJetEvent E; E.Type = Type; E.Time = Clock; E.Fence = Fence; E.Plane = Plane; E.Value = Value; E.Text = Text; E.Spot = Spot; E.Leg = Leg;
	Events.Add(E);
}

int32 FJetRide::TimeFaults() const
{
	if (Mode != EJetMode::TableA || Course.TimeAllowed <= 0) return 0;
	return Time > Course.TimeAllowed ? FMath::CeilToInt(Time - Course.TimeAllowed - 1e-6f) : 0;
}
float FJetRide::ScoreTime() const { return Time + (Mode == EJetMode::TableC ? DownFences.Num() * 4.f : 0.f); }
float FJetRide::Power() const { return (0.82f + 0.18f * Stamina) * Horse.Form; }

float FJetRide::IdealFor(const FJetFence& E, float Vel) const
{
	const int32 Key = E.Index * 100 + FMath::RoundToInt(Vel * 4);
	if (const float* R = IdealCache.Find(Key)) return *R;
	const float R = IdealTakeoff(E, FMath::Max(Vel, 4.f), Horse, Power());
	IdealCache.Add(Key, R);
	return R;
}

void FJetRide::Local(const FJetFence& E, float Px, float Pz, float& A, float& B) const
{
	const float Dx = Px - E.X, Dz = Pz - E.Z; const FVector2D N = E.N(), L = E.L();
	A = Dx * N.X + Dz * N.Y; B = Dx * L.X + Dz * L.Y;
}

FJetRide::FCandidate FJetRide::Candidate() const
{
	const float Hx = FMath::Cos(Heading), Hz = FMath::Sin(Heading);
	FCandidate Best;
	for (const FJetFence& E : Course.Fences)
	{
		float A, B; Local(E, X, Z, A, B);
		const float D = -A;
		if (D < -0.3f || D > 16.f) continue;
		const FVector2D N = E.N(), L = E.L();
		const float CosA = Hx * N.X + Hz * N.Y;
		if (CosA < 0.45f) continue;
		if (Lock == E.Index && D < 7.f) continue;
		const float Lat = Hx * L.X + Hz * L.Y;
		const float Bp = B + Lat / CosA * FMath::Max(D, 0.f);
		if (FMath::Abs(Bp) > E.HalfWidth + 1.6f) continue;
		if (!Best.E || D < Best.D) { Best.E = &E; Best.D = D; Best.CosA = CosA; Best.Bp = Bp; }
	}
	return Best;
}

float FJetRide::StrideLen() const { const float F = StrideFreq(FMath::Max(Gait, 3), FMath::Max(V, 3.f)); return FMath::Max(V, 3.f) / F; }

FJetApproach FJetRide::Approach() const
{
	FJetApproach Ap;
	if (bJumping || Next >= Course.Fences.Num()) return Ap;
	const FJetFence& E = Course.Fences[Next];
	float A, B; Local(E, X, Z, A, B);
	const float D = -A;
	const FVector2D N = E.N();
	Ap.bValid = true; Ap.Fence = E.Index; Ap.Distance = D; Ap.Lateral = B;
	Ap.CosAngle = FMath::Cos(Heading) * N.X + FMath::Sin(Heading) * N.Y;
	Ap.StrideLength = StrideLen();
	Ap.IdealTakeoff = IdealFor(E, V);
	Ap.Strides = (D - Ap.IdealTakeoff) / Ap.StrideLength;
	float Frac = FMath::Fmod((D - Ap.IdealTakeoff) / Ap.StrideLength, 1.f); if (Frac < 0) Frac += 1.f;
	Ap.Meter = Frac > 0.5f ? Frac - 1.f : Frac;
	const float DN = D - Ap.StrideLength * StrideScale;
	Ap.bAskWindow = Gait >= 2 && D > Ap.IdealTakeoff && DN < Ap.IdealTakeoff + Ap.StrideLength * 0.5f && Ap.CosAngle > 0.6f;
	return Ap;
}

void FJetRide::Step(float Dt, const FJetInput& In)
{
	Events.Reset();
	if (bFinished || (bEliminated && !bTraining)) { GroundMove(Dt, 0.f, -2.f, true); UpdatePose(Dt); return; }
	Clock += Dt;
	if (!bStarted && Clock >= Countdown) { bStarted = true; Emit(EJetEvent::Start, -1, -1, 1.f); }
	if (bStarted && !bFinished) Time += Dt;
	if (Course.TimeLimit > 0 && Time > Course.TimeLimit && Mode != EJetMode::Training) Eliminate(TEXT("Tiempo límite excedido"));
	if (In.bJump) AskT = Clock;
	Pace = Clamp(Pace + In.Pace * Dt * 0.55f, 0.f, 1.f);
	if (In.PaceSet >= 0.f) Pace = Clamp(In.PaceSet, 0.f, 1.f);
	if (bJumping) StepJump(Dt, In); else StepGround(Dt, In);
	Lines();
	UpdatePose(Dt);
}

void FJetRide::Eliminate(const FString& Reason)
{
	if (bEliminated || bFinished) return;
	if (bTraining) { Emit(EJetEvent::Feedback, -1, -1, 0, Reason); return; }
	bEliminated = true; Elimination = Reason;
	Emit(EJetEvent::Eliminated, -1, -1, 0, Reason);
}

void FJetRide::StepGround(float Dt, const FJetInput& In)
{
	if (bRefusing)
	{
		RefuseT -= Dt;
		V = FMath::Max(0.f, V - 11.f * Dt);
		if (RefuseT <= 0) { bRefusing = false; Pace = FMath::Min(Pace, 0.12f); }
		GroundMove(Dt, V < 1.f ? In.Steer : 0.f, 0.f, true);
		return;
	}
	GroundMove(Dt, In.Steer, 0.f, false);
}

void FJetRide::GroundMove(float Dt, float SteerIn, float, bool bLocked)
{
	float Target = bLocked ? (bRefusing ? 0.f : FMath::Min(PaceToSpeed(Pace, Top), V)) : PaceToSpeed(Pace, Top);
	if (bFinished || bEliminated) { Target = FMath::Max(0.f, V - 2.5f * Dt); Pace = SpeedToPace(Target, Top); }
	const float Acc = (1.4f + 1.4f * Horse.Ride) * (0.75f + 0.25f * Stamina);
	const float Dec = 2.4f + 1.6f * Horse.Ride;
	if (V < Target) V = FMath::Min(Target, V + Acc * Dt); else V = FMath::Max(Target, V - Dec * Dt);

	static const float Up[4] = { 0.25f, 2.4f, 4.3f, 8.7f }, Dn[4] = { 0.15f, 2.0f, 3.9f, 8.3f };
	int32 G = Gait;
	while (G < 4 && V > Up[G]) G++;
	while (G > 0 && V < Dn[G - 1]) G--;
	if (G != Gait) { Emit(EJetEvent::Gait, -1, -1, (float)G); Gait = G; }

	const float Steer = Clamp(SteerIn, -1.f, 1.f);
	float MaxTurn;
	if (V < 0.4f) MaxTurn = 1.3f;
	else { const float RMin = FMath::Max(1.8f, V * V / (5.0f + 2.0f * Rider.Turns + 1.0f * Horse.Ride)); MaxTurn = FMath::Min(2.0f, V / RMin); }
	float Want = Steer * MaxTurn;
	const int32 SteerSign = Steer > 0 ? 1 : (Steer < 0 ? -1 : 0);
	if (Gait >= 3 && SteerSign != 0 && SteerSign != Lead && FMath::Abs(Steer) > 0.25f) { Want *= 0.62f; WrongLeadT += Dt; }
	else WrongLeadT = FMath::Max(0.f, WrongLeadT - Dt * 2);
	Omega += (Want - Omega) * FMath::Min(1.f, Dt * 7);
	Heading += Omega * Dt;

	const float Hx = FMath::Cos(Heading), Hz = FMath::Sin(Heading);
	MoveTo(X + Hx * V * Dt, Z + Hz * V * Dt, Dt);

	if (Gait >= 1)
	{
		const float F = StrideFreq(Gait, FMath::Max(V, 0.5f)) / StrideScale;
		const float Prev = Phase;
		Phase += F * Dt;
		float Offs[4]; FootOffsets(Gait, Lead, Offs);
		for (int32 Leg = 0; Leg < 4; Leg++) { const float O = Offs[Leg]; if ((Prev < O && Phase >= O) || (Prev < O + 1 && Phase >= O + 1)) Emit(EJetEvent::Hoof, -1, -1, V, FString(), EJetSpot::Perfect, Leg); }
		if (Phase >= 1) { Phase -= 1; OnBoundary(); }
	}

	const float K = V / 7.f;
	if (Gait >= 3) Stamina -= K * K * 0.0035f * Dt * (1.4f - 0.6f * Horse.Stamina);
	else if (Gait <= 1) Stamina += 0.012f * Dt;
	Stamina = Clamp(Stamina, 0.2f, 1.f);
}

void FJetRide::MoveTo(float Nx, float Nz, float Dt)
{
	const float R = 0.55f;
	for (const FJetFence& E : Course.Fences)
	{
		if (bJumping) break;
		float A0, B0, A1, B1; Local(E, X, Z, A0, B0); Local(E, Nx, Nz, A1, B1);
		const float Far = E.Spread + 0.35f + (E.bWater ? E.WaterEnd - E.Spread : 0);
		auto Inside = [&](float A, float B) { return A > -0.4f && A < Far && FMath::Abs(B) < E.HalfWidth + 0.1f; };
		if (!Inside(A0, B0) && Inside(A1, B1))
		{
			const bool bApproaching = A0 <= -0.4f;
			if (bApproaching && E.Index == Next && V > 1.8f && Lock != E.Index && Clock - LastRefuseT > 3.f) DoRefusal(E, TEXT("Rehúse"));
			const FVector2D L = E.L();
			const float Dx = Nx - X, Dz = Nz - Z;
			const float Along = Dx * L.X + Dz * L.Y;
			const float Side = (B0 >= 0 ? 1.f : -1.f) * 0.4f * Dt;
			Nx = X + L.X * (Along + Side); Nz = Z + L.Y * (Along + Side);
			V = FMath::Min(V, 1.2f) * 0.9f; Omega *= 0.5f;
			float A2, B2; Local(E, Nx, Nz, A2, B2);
			if (Inside(A2, B2)) return;
		}
		const FVector2D N = E.N(), L = E.L();
		for (int32 S = -1; S <= 1; S += 2) for (const FJetPlane& Pl : E.Planes)
		{
			const float Cx = E.X + N.X * Pl.Offset + L.X * S * (E.HalfWidth + 0.3f);
			const float Cz = E.Z + N.Y * Pl.Offset + L.Y * S * (E.HalfWidth + 0.3f);
			const float Dx = Nx - Cx, Dz = Nz - Cz, Dd = FMath::Sqrt(Dx * Dx + Dz * Dz);
			const float Rr = R + 0.35f;
			if (Dd < Rr && Dd > 1e-4f) { Nx = Cx + Dx / Dd * Rr; Nz = Cz + Dz / Dd * Rr; V *= 0.97f; }
		}
	}
	const float Mx = Course.ArenaWidth / 2 - 1.2f, Mz = Course.ArenaDepth / 2 - 1.2f;
	if (FMath::Abs(Nx) > Mx || FMath::Abs(Nz) > Mz) { Nx = Clamp(Nx, -Mx, Mx); Nz = Clamp(Nz, -Mz, Mz); V *= FMath::Pow(0.2f, Dt); }
	if (Next < Course.Fences.Num())
	{
		const FJetFence& E = Course.Fences[Next];
		float A0, B0, A1, B1; Local(E, X, Z, A0, B0); Local(E, Nx, Nz, A1, B1);
		if (A0 < 0 && A1 >= 0 && FMath::Abs(B1) > E.HalfWidth && FMath::Abs(B1) < E.HalfWidth + 3.5f && V > 2.f && Lock != E.Index) DoRefusal(E, TEXT("Escape"));
	}
	X = Nx; Z = Nz;
}

void FJetRide::OnBoundary()
{
	StrideScale = 1.f;
	Emit(EJetEvent::Stride, -1, -1, V);
	if (WrongLeadT > 0.55f && Gait >= 3)
	{
		if (Rand() < 0.55f + 0.4f * Horse.Ride) { Lead = -Lead; WrongLeadT = 0; Emit(EJetEvent::Lead, -1, -1, (float)Lead); }
		else WrongLeadT = 0.3f;
	}
	if (Lock >= 0) { float A, B; Local(Course.Fences[Lock], X, Z, A, B); if (-A > 7.f || A > 1.f) Lock = -1; }
	JumpLogic();
}

void FJetRide::JumpLogic()
{
	if (Gait < 2 || V < 2.5f) return;
	const FCandidate C = Candidate();
	if (!C.E) return;
	const FJetFence& E = *C.E;
	const float D = C.D, CosA = C.CosA, Bp = C.Bp;
	const float L = V / StrideFreq(Gait, V);
	const float Ideal = IdealFor(E, V);
	const float StrideT = 1.f / StrideFreq(Gait, V);
	const float Age = Clock - AskT;
	const bool bAsked = Age < StrideT * 1.65f;
	const float NextD = D - L;
	const bool bLined = FMath::Abs(Bp) < E.HalfWidth - 0.15f;

	if (D >= 0.35f && D <= 3.75f)
	{
		if (!bLined) { if (E.Index == Next && FMath::Abs(Bp) < E.HalfWidth + 1.6f && (bAsked || NextD < 0.5f)) DoRefusal(E, TEXT("Escape")); return; }
		const float Big = FMath::Max(0.f, E.Height - Horse.Scope - 0.02f) * 3.f;
		const float Slow = FMath::Max(0.f, 4.6f - V) * 0.18f * (E.Height / 1.3f);
		const float Angle = FMath::Max(0.f, 0.82f - CosA) * 2.2f;
		const float Nerve = 0.5f * Horse.Bold + 0.5f * Rider.Nerve;
		const float PRefuse = Clamp(0.01f + Big + Slow + Angle - 0.06f * Nerve, 0.f, 0.85f);
		if (bAsked)
		{
			if (Rand() < PRefuse) { DoRefusal(E, TEXT("Rehúse")); return; }
			const bool bOnTime = Age < StrideT * 0.95f;
			Takeoff(E, D, CosA, bOnTime ? 1.04f : 0.95f, bOnTime ? TEXT("ok") : TEXT("early"));
			return;
		}
		if (NextD < 0.45f)
		{
			const float PGo = Clamp(0.25f + 0.6f * Horse.Bold - PRefuse * 1.5f + (bAssist ? 0.1f : 0.f), 0.05f, 0.95f);
			if (Rand() < PGo) Takeoff(E, D, CosA, 0.9f, TEXT("auto")); else DoRefusal(E, TEXT("Rehúse"));
			return;
		}
	}
	else if (D > -0.3f && D < 0.35f && bLined) { DoRefusal(E, TEXT("Rehúse")); return; }

	if (D < 12.f && D > Ideal + 0.3f && bLined)
	{
		const float Adj = 0.06f + 0.09f * Horse.Ride + 0.09f * Rider.Eye + (bAssist ? 0.05f : 0.f);
		const int32 K = FMath::Max(1, FMath::RoundToInt((D - Ideal) / L));
		StrideScale = Clamp((D - Ideal) / (K * L), 1 - Adj, 1 + Adj);
	}
}

void FJetRide::DoRefusal(const FJetFence& E, const FString& Kind)
{
	if (bRefusing || bJumping) return;
	bRefusing = true; RefuseT = 0.9f;
	Lock = E.Index; LastRefuseT = Clock; Omega = 0;
	if (E.Index != Next || !bStarted) { Emit(EJetEvent::Halt, E.Index); return; }
	Disobediences++;
	if (Mode != EJetMode::Training) { if (Mode == EJetMode::TableA || Mode == EJetMode::Power) JumpFaults += 4; else Time += 6.f; }
	Emit(EJetEvent::Refusal, E.Index, -1, (float)Disobediences, Kind);
	if (E.ComboPos > 0) { Next = E.ComboStart; Lock = -1; }
	if (Disobediences >= 2 && Mode != EJetMode::Training) Eliminate(TEXT("Segunda desobediencia"));
}

void FJetRide::Takeoff(const FJetFence& E, float D, float CosA, float Support, const FString& How)
{
	const float Pw = Power() * Support;
	const FJumpSolution Sol = SolveJump(V, D, CosA, E, Horse, Pw);
	Jump = FJump();
	Jump.Fence = E.Index; Jump.T = 0; Jump.Dur = Sol.Prof.T; Jump.U = Sol.Prof.U; Jump.H = Sol.H; Jump.TUp = Sol.Prof.TUp; Jump.PitchAmp = Sol.Prof.Pitch;
	Jump.X0 = X; Jump.Z0 = Z; Jump.Hx = FMath::Cos(Heading); Jump.Hz = FMath::Sin(Heading); Jump.V0 = V; Jump.bWet = Sol.bWet; Jump.LandLead = Lead; Jump.D = D;
	bool bCrash = false;
	for (int32 I = 0; I < Sol.Planes.Num(); I++)
	{
		const FPlaneEval& P = Sol.Planes[I];
		const float Cc = P.C + 0.02f * (Rider.Balance - 0.5f);
		float Pd = 0;
		if (Cc < 0.03f) Pd = FMath::Pow(Clamp((0.03f - Cc) / 0.24f, 0, 1), 1.3f);
		if (Cc < 0.10f) Pd += 0.05f * (1 - Horse.Care);
		Pd *= 1.1f - 0.4f * Horse.Care;
		const bool bDown = Rand() < Pd;
		if (Cc < -0.7f && P.Front < P.Hind) bCrash = true;
		Jump.Knocks.Add({ I, P.X / Sol.Prof.U, Cc, bDown, P.Front < P.Hind, false });
	}
	Jump.bCrash = bCrash && Rand() < 0.3f;
	const float Quality = D - IdealFor(E, V);
	Jump.Ideal = D - Quality;
	Jump.Spot = FMath::Abs(Quality) < 0.4f ? EJetSpot::Perfect : (Quality > 0 ? EJetSpot::Long : EJetSpot::Deep);
	StatJumps++; if (Jump.Spot == EJetSpot::Perfect) StatPerfect++; else if (Jump.Spot == EJetSpot::Long) StatLong++; else StatDeep++;
	bJumping = true; bRefusing = false; StrideScale = 1;
	Stamina -= 0.012f + 0.02f * E.Height;
	Emit(EJetEvent::Takeoff, E.Index, -1, D - Jump.Ideal, How, Jump.Spot);
	if (E.Index != Next && !bTraining) bWrongFence = true;
}

void FJetRide::StepJump(float Dt, const FJetInput& In)
{
	FJump& J = Jump;
	J.T += Dt;
	const float S = FMath::Min(J.T, J.Dur);
	X = J.X0 + J.Hx * J.U * S; Z = J.Z0 + J.Hz * J.U * S;
	const float Dx = S - J.TUp;
	Y = Y0 + J.H - 0.5f * G * Dx * Dx;
	if (FMath::Abs(In.Steer) > 0.3f) J.LandLead = In.Steer > 0 ? 1 : -1;
	for (FKnock& K : J.Knocks)
	{
		if (K.bDone || J.T < K.T) continue;
		K.bDone = true;
		if (K.bDown)
		{
			Emit(EJetEvent::Knock, J.Fence, K.Plane, K.C, K.bFront ? TEXT("front") : TEXT("hind"));
			if (!DownFences.Contains(J.Fence)) { DownFences.Add(J.Fence); StatRails++; if (Mode == EJetMode::TableA || Mode == EJetMode::Power) JumpFaults += 4; }
		}
		else if (K.C < 0.07f) Emit(EJetEvent::Rub, J.Fence, K.Plane, K.C);
	}
	if (J.T >= J.Dur) Land();
}

void FJetRide::Land()
{
	FJump J = Jump;
	bJumping = false;
	Y = Y0; V = J.V0 * 0.96f; Gait = V > 8.7f ? 4 : 3; Phase = 0;
	if (J.LandLead != Lead) { Lead = J.LandLead; Emit(EJetEvent::Lead, -1, -1, (float)Lead, TEXT("air")); }
	Emit(EJetEvent::Land, J.Fence, -1, V, FString(), J.Spot);
	if (J.bWet)
	{
		Emit(EJetEvent::Water, J.Fence);
		if (!DownFences.Contains(J.Fence)) { DownFences.Add(J.Fence); if (Mode == EJetMode::TableA || Mode == EJetMode::Power) JumpFaults += 4; }
	}
	if (J.bCrash) { Emit(EJetEvent::Fall); V = 0; Eliminate(TEXT("Caída")); return; }
	if (bWrongFence) { bWrongFence = false; Eliminate(TEXT("Error de recorrido")); return; }
	if (J.Fence == Next || bTraining)
	{
		Next = bTraining ? (J.Fence + 1) % Course.Fences.Num() : Next + 1;
		Lock = -1;
		Emit(EJetEvent::Cleared, J.Fence, -1, DownFences.Contains(J.Fence) ? 1.f : 0.f);
	}
	JumpLogic();
}

void FJetRide::Lines()
{
	auto Crossed = [&](const FJetLine& Ln, float Px, float Pz)
	{
		const float Nx = FMath::Cos(Ln.Heading), Nz = FMath::Sin(Ln.Heading);
		const float A0 = (Px - Ln.X) * Nx + (Pz - Ln.Z) * Nz;
		const float A1 = (X - Ln.X) * Nx + (Z - Ln.Z) * Nz;
		const float B = -(X - Ln.X) * Nz + (Z - Ln.Z) * Nx;
		return A0 < 0 && A1 >= 0 && FMath::Abs(B) < Ln.HalfWidth;
	};
	const float Px = bHavePrev ? PrevX : X, Pz = bHavePrev ? PrevZ : Z;
	if (!bStarted && Crossed(Course.Start, Px, Pz)) { bStarted = true; Emit(EJetEvent::Start); }
	if (bStarted && !bFinished && Next >= Course.Fences.Num() && !bTraining && Crossed(Course.Finish, Px, Pz)) { bFinished = true; Emit(EJetEvent::Finish, -1, -1, Time); }
	PrevX = X; PrevZ = Z; bHavePrev = true;
}

void FJetRide::UpdatePose(float Dt)
{
	float P = 0, R = 0;
	if (bJumping) P = Jump.PitchAmp * FMath::Cos(PI * FMath::Min(Jump.T / Jump.Dur, 1.f));
	else { Y += (Y0 - Y) * FMath::Min(1.f, Dt * 10); R = -FMath::Atan(V * Omega / G) * 0.6f; }
	Pitch += (P - Pitch) * FMath::Min(1.f, Dt * (bJumping ? 30.f : 8.f));
	Roll += (R - Roll) * FMath::Min(1.f, Dt * 6);
}

// ------------------------------------------------------------------ AutoRider
FJetAutoRider::FJetAutoRider(FJetRide& InRide, float InSkill, int32 Seed, float InCruise) : Ride(InRide), Skill(InSkill), Cruise(InCruise), Rng(Seed + 101) { BuildPath(); }

void FJetAutoRider::BuildPath()
{
	const FJetCourse& C = Ride.GetCourse();
	Path.Reset();
	Path.Add({ C.Start.X, C.Start.Z, 3, -1, 0 });
	const TArray<FJetFence>& Els = C.Fences;
	for (int32 I = 0; I < Els.Num(); I++)
	{
		const FJetFence& E = Els[I]; const FVector2D N = E.N();
		if (E.ComboPos == 0) { Path.Add({ E.X - N.X * 13, E.Z - N.Y * 13, 4, I, 1 }); Path.Add({ E.X - N.X * 7, E.Z - N.Y * 7, 2.5f, I, 2 }); }
		Path.Add({ E.X + N.X * (E.Spread / 2), E.Z + N.Y * (E.Spread / 2), 1.5f, I, 3 });
		const bool bLast = I == Els.Num() - 1 || Els[I + 1].ComboStart != E.ComboStart;
		if (bLast) Path.Add({ E.X + N.X * (E.Spread + 7), E.Z + N.Y * (E.Spread + 7), 3, -1, 4 });
	}
	Path.Add({ C.Finish.X + FMath::Cos(C.Finish.Heading) * 6, C.Finish.Z + FMath::Sin(C.Finish.Heading) * 6, 3, -1, 5 });
}

FJetInput FJetAutoRider::Input(float Dt)
{
	FJetRide& R = Ride;
	FJetInput In;
	const int32 Last = Path.Num() - 1;
	FWaypoint Tgt = Path[FMath::Min(Wp, Last)];
	if (Tgt.Fence >= 0 && R.Next > Tgt.Fence && Wp < Last) Wp++;
	if (FMath::Sqrt(FMath::Square(Tgt.X - R.X) + FMath::Square(Tgt.Z - R.Z)) < Tgt.R && Wp < Last) Wp++;
	if (R.bRefusing || (R.Lock >= 0 && R.Lock == R.Next))
	{
		for (int32 K = 0; K < Path.Num(); K++) if (Path[K].Fence == R.Next && Path[K].Kind == 2) { Wp = FMath::Max(0, K - 1); break; }
	}
	Tgt = Path[FMath::Min(Wp, Last)];
	FWaypoint Look = Path[FMath::Min(Wp + 1, Last)];
	const TArray<FJetFence>& Els = R.GetCourse().Fences;
	if (R.Next < Els.Num() && (Tgt.Kind == 1 || Tgt.Kind == 2) && Tgt.Fence == R.Next)
	{
		const FJetFence& E = Els[R.Next]; float A, B; R.Local(E, R.X, R.Z, A, B);
		if (A > -3.f && FMath::Abs(B) < E.HalfWidth + 1.5f)
		{
			const float Sgn = B >= 0 ? 1.f : -1.f; const FVector2D N = E.N(), L = E.L();
			Tgt = { E.X + L.X * Sgn * (E.HalfWidth + 3.5f) - N.X, E.Z + L.Y * Sgn * (E.HalfWidth + 3.5f) - N.Y, 2, -1, 6 };
			Look = Tgt;
		}
	}
	const float Dist = FMath::Sqrt(FMath::Square(Tgt.X - R.X) + FMath::Square(Tgt.Z - R.Z));
	const float W = Clamp(1 - Dist / 8, 0, 0.6f);
	const float Ax = FMath::Lerp(Tgt.X, Look.X, W), Az = FMath::Lerp(Tgt.Z, Look.Z, W);
	const float Want = FMath::Atan2(Az - R.Z, Ax - R.X);
	const float Err = AngDiff(R.Heading, Want);
	Noise += ((Rng.FRand() - 0.5f) * 2 - Noise) * Dt * 2;
	In.Steer = Clamp(Err * 2.6f + Noise * 0.15f * (1 - Skill), -1, 1);

	float VT = Cruise;
	const FJetApproach Ap = R.Approach();
	if (FMath::Abs(Err) > 0.9f) VT = FMath::Min(VT, 5.2f);
	if (Ap.bValid && Ap.Distance > 0 && Ap.Distance < 30 && Ap.CosAngle > 0.8f)
	{
		const float Raw = (Ap.Distance - Ap.IdealTakeoff) / Ap.StrideLength;
		if (PlanEl != R.Next) { PlanEl = R.Next; PlanK = -1; }
		if (Raw >= 1.15f)
		{
			if (PlanK < 0 || FMath::Abs(Raw - PlanK) > 0.75f)
			{
				float BestE = TNumericLimits<float>::Max();
				for (int32 Kk : { FMath::FloorToInt(Raw), FMath::CeilToInt(Raw) })
				{
					if (Kk < 1) continue;
					const float Lw = (Ap.Distance - Ap.IdealTakeoff) / Kk;
					const float VW = 1.45f * Lw / FMath::Max(0.2f, 1 - 0.045f * Lw);
					const float Ee = FMath::Abs(VW - Cruise);
					if (Ee < BestE) { BestE = Ee; PlanK = Kk; }
				}
			}
			VT = Cruise;
		}
		else VT = LastVT >= 0 ? LastVT : R.V;
		const float ErrEye = (1 - Skill) * 0.12f;
		VT = Clamp(VT * (1 + (Rng.FRand() - 0.5f) * ErrEye), Cruise - 1.3f, Cruise + 1.3f);
		if (Els[Ap.Fence].bWater && Ap.Distance < 24) VT = FMath::Max(VT, 7.6f + 0.8f * Skill);
		LastVT = VT;
		for (const FJetEvent& E : R.Events)
		{
			if (E.Type == EJetEvent::Stride || E.Type == EJetEvent::Land)
			{
				const float DN = Ap.Distance - Ap.StrideLength * R.StrideScale;
				if (FMath::Abs(DN - Ap.IdealTakeoff) < Ap.StrideLength * 0.5f && DN > 0.3f && Asked != R.Next)
				{
					AskAt = R.Clock + (0.3f + 0.3f * Rng.FRand()) / StrideFreq(FMath::Max(R.Gait, 3), R.V);
					Asked = R.Next;
				}
			}
		}
	}
	if (AskAt >= 0 && R.Clock >= AskAt) { AskAt = -1; if (Rng.FRand() < 0.9f + 0.1f * Skill) In.bJump = true; }
	if (!R.bStarted && R.Clock < 30) VT = FMath::Min(VT, 6.0f);
	In.PaceSet = SpeedToPace(VT, R.Top);
	if (R.bJumping) Asked = -1;
	return In;
}

float JetSim::PathLength(const FJetCourse& Course)
{
	// misma línea ideal que FJetAutoRider::BuildPath
	TArray<FVector2D> P;
	P.Add({ Course.Start.X, Course.Start.Z });
	const TArray<FJetFence>& Els = Course.Fences;
	for (int32 I = 0; I < Els.Num(); I++)
	{
		const FJetFence& E = Els[I]; const FVector2D N = E.N();
		if (E.ComboPos == 0) { P.Add({ E.X - N.X * 13, E.Z - N.Y * 13 }); P.Add({ E.X - N.X * 7, E.Z - N.Y * 7 }); }
		P.Add({ E.X + N.X * (E.Spread / 2), E.Z + N.Y * (E.Spread / 2) });
		const bool bLast = I == Els.Num() - 1 || Els[I + 1].ComboStart != E.ComboStart;
		if (bLast) P.Add({ E.X + N.X * (E.Spread + 7), E.Z + N.Y * (E.Spread + 7) });
	}
	P.Add({ Course.Finish.X + FMath::Cos(Course.Finish.Heading) * 6, Course.Finish.Z + FMath::Sin(Course.Finish.Heading) * 6 });
	float L = 0; for (int32 I = 1; I < P.Num(); I++) L += FVector2D::Distance(P[I], P[I - 1]);
	return L * 1.08f;
}

FJetRoundResult JetSim::SimulateRound(const FJetCourse& Course, const FJetHorseStats& Horse, const FJetRiderSkills& Rider, float Skill, int32 Seed, EJetMode Mode, float Cruise)
{
	FJetRide Ride(Course, Horse, Rider, Mode, Seed, false);
	FJetAutoRider AI(Ride, Skill, Seed, Cruise);
	const float Dt = 1.f / 30.f;
	for (int32 I = 0; I < 30 * 400; I++) { Ride.Step(Dt, AI.Input(Dt)); if (Ride.bFinished || Ride.bEliminated) break; }
	FJetRoundResult R;
	R.Faults = Ride.Faults(); R.Time = Ride.Time; R.ScoreTime = Ride.ScoreTime(); R.Rails = Ride.StatRails; R.Refusals = Ride.Disobediences;
	R.bEliminated = Ride.bEliminated || !Ride.bFinished; R.EliminationReason = Ride.bEliminated ? Ride.Elimination : (Ride.bFinished ? FString() : TEXT("Retirado"));
	return R;
}

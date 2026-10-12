#include "JetHUD.h"
#include "JetGameMode.h"
#include "JetCourseActor.h"
#include "JetHorsePawn.h"
#include "JetRideComponent.h"
#include "JetSim.h"
#include "Engine/Canvas.h"
#include "Engine/Engine.h"
#include "Engine/Font.h"
#include "Engine/World.h"

AJetHUD::AJetHUD() { PrimaryActorTick.bCanEverTick = true; }

void AJetHUD::Panel(float X, float Y, float W, float H, float Alpha)
{
	DrawRect(FLinearColor(0.03f, 0.04f, 0.06f, Alpha), X, Y, W, H);
	DrawRect(FLinearColor(Accent.R, Accent.G, Accent.B, Alpha * 0.9f), X, Y, 3.f * Scale, H);
}

void AJetHUD::Label(const FString& T, float X, float Y, float S, const FLinearColor& C, UFont* F)
{
	DrawText(T, C, X, Y, F ? F : Mid, S * Scale, false);
}

float AJetHUD::Width(const FString& T, float S, UFont* F)
{
	float W = 0.f, H = 0.f; GetTextSize(T, W, H, F ? F : Mid, S * Scale); return W;
}

static const TCHAR* GaitName(EJetGait G)
{
	switch (G) { case EJetGait::Walk: return TEXT("Paso"); case EJetGait::Trot: return TEXT("Trote"); case EJetGait::Canter: return TEXT("Galope"); case EJetGait::Gallop: return TEXT("Galope largo"); default: return TEXT("Parado"); }
}

void AJetHUD::DrawHUD()
{
	Super::DrawHUD();
	if (!Canvas || !GEngine) return;
	if (!Big) { Big = GEngine->GetLargeFont(); Mid = GEngine->GetMediumFont(); Small = GEngine->GetSmallFont(); }
	const AJetGameMode* GM = GetWorld() ? GetWorld()->GetAuthGameMode<AJetGameMode>() : nullptr;
	const UJetRideComponent* R = GM ? GM->GetRide() : nullptr;
	const float SX = Canvas->SizeX, SY = Canvas->SizeY;
	const float M = 18.f * Scale;
	const FLinearColor White(0.96f, 0.96f, 0.94f), Dim(0.7f, 0.72f, 0.75f), Red(1.f, 0.35f, 0.3f), Green(0.45f, 0.95f, 0.5f);
	const float Now = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.f;

	if (!GM || !R)
	{
		Label(TEXT("JETJUMP: falta el JetGameMode o el caballo (ver README del plugin)"), M, M, 1.2f, Red);
		return;
	}
	const FJetCourse& C = R->CourseRef();
	const FJetApproach A = R->GetApproach();
	const int32 Next = R->GetNextFence();

	// ---------- arriba a la izquierda: evento y próxima valla
	{
		const float W = 300.f * Scale, H = 112.f * Scale;
		Panel(M, M, W, H);
		Label(TEXT("JETJUMP"), M + 14.f * Scale, M + 8.f * Scale, 0.9f, Accent, Small);
		Label(C.Name.IsEmpty() ? TEXT("Pista") : C.Name, M + 80.f * Scale, M + 8.f * Scale, 0.9f, Dim, Small);
		if (C.Fences.IsValidIndex(Next))
		{
			const FJetFence& E = C.Fences[Next];
			Label(FString::Printf(TEXT("VALLA %s"), *E.Label), M + 14.f * Scale, M + 28.f * Scale, 1.6f, White, Big);
			Label(FString::Printf(TEXT("%s · %.2f m"), *UJetSimLibrary::FenceTypeName(E.Type), E.Height), M + 14.f * Scale, M + 66.f * Scale, 1.f, Dim);
			if (A.bValid && A.Distance > 0.f)
			{
				const FString D = A.Distance < 60.f ? FString::Printf(TEXT("%.0f m · %.1f trancos"), A.Distance, A.Strides) : FString::Printf(TEXT("%.0f m"), A.Distance);
				Label(D, M + 14.f * Scale, M + 86.f * Scale, 1.f, White);
			}
		}
		else if (R->IsRunning()) Label(TEXT("A LA LLEGADA"), M + 14.f * Scale, M + 28.f * Scale, 1.6f, Green, Big);
		Label(FString::Printf(TEXT("%d / %d"), FMath::Min(Next + 1, C.Fences.Num()), C.Fences.Num()), M + W - 70.f * Scale, M + 8.f * Scale, 0.9f, Dim, Small);
	}

	// ---------- arriba a la derecha: tiempo, faltas, velocidad
	{
		const float W = 250.f * Scale, H = 112.f * Scale, X = SX - M - W;
		Panel(X, M, W, H);
		const float T = R->GetTime(), TA = C.TimeAllowed;
		const bool bOver = T > TA && TA > 0.f;
		Label(FString::Printf(TEXT("%.2f"), T), X + 14.f * Scale, M + 20.f * Scale, 2.0f, bOver ? Red : White, Big);
		Label(FString::Printf(TEXT("TA %.0f s"), TA), X + 14.f * Scale, M + 64.f * Scale, 0.9f, bOver ? Red : Dim, Small);
		const int32 F = R->GetFaults();
		const FString FaultsStr = GM->Mode == EJetMode::TableC ? FString::Printf(TEXT("%.1f s"), R->GetResult().ScoreTime) : FString::Printf(TEXT("%d F"), F);
		const float FW = Width(FaultsStr, 1.8f, Big);
		Label(FaultsStr, X + W - 14.f * Scale - FW, M + 20.f * Scale, 1.8f, F > 0 ? Red : Green, Big);
		Label(FString::Printf(TEXT("%.1f km/h · %s"), R->SpeedKmh, GaitName(R->Gait)), X + 14.f * Scale, M + 86.f * Scale, 1.f, White);
		// energía
		DrawRect(FLinearColor(1, 1, 1, 0.15f), X + 14.f * Scale, M + 106.f * Scale - 4.f, W - 28.f * Scale, 3.f);
		DrawRect(R->Stamina > 0.3f ? Green : Red, X + 14.f * Scale, M + 106.f * Scale - 4.f, (W - 28.f * Scale) * FMath::Clamp(R->Stamina, 0.f, 1.f), 3.f);
	}

	// ---------- medidor de batida (centro abajo)
	if (A.bValid && A.Distance > 0.f && A.Distance < 40.f && R->IsRunning())
	{
		const float W = 360.f * Scale, H = 26.f * Scale, X = SX / 2.f - W / 2.f, Y = SY - M - 70.f * Scale;
		Panel(X, Y, W, H, 0.45f);
		const float Inner = W - 20.f * Scale, X0 = X + 10.f * Scale, Yc = Y + H / 2.f;
		DrawRect(FLinearColor(1, 1, 1, 0.12f), X0, Yc - 3.f, Inner, 6.f);
		DrawRect(FLinearColor(0.45f, 0.95f, 0.5f, 0.6f), X0 + Inner * 0.42f, Yc - 5.f, Inner * 0.16f, 10.f); // zona buena
		const float P = FMath::Clamp(0.5f + A.Meter, 0.f, 1.f);
		DrawRect(A.bAskWindow ? Accent : White, X0 + Inner * P - 3.f, Yc - 9.f, 6.f, 18.f);
		AskFlash = A.bAskWindow ? 1.f : FMath::Max(0.f, AskFlash - 0.05f);
		if (AskFlash > 0.f)
		{
			const FString S = TEXT("¡SALTÁ!");
			Label(S, SX / 2.f - Width(S, 1.6f, Big) / 2.f, Y - 40.f * Scale, 1.6f, FLinearColor(Accent.R, Accent.G, Accent.B, AskFlash), Big);
		}
		Label(TEXT("corto"), X0, Y + H + 2.f, 0.8f, Dim, Small);
		const FString L = TEXT("largo"); Label(L, X0 + Inner - Width(L, 0.8f, Small), Y + H + 2.f, 0.8f, Dim, Small);
	}

	// ---------- cuenta atrás
	const float CD = R->GetCountdownLeft();
	if (CD > 0.f && R->IsRunning())
	{
		const FString S = FString::Printf(TEXT("Campana en %.0f s · cruzá la salida"), CD);
		Label(S, SX / 2.f - Width(S, 1.2f) / 2.f, M + 130.f * Scale, 1.2f, Accent);
	}

	// ---------- mensajes
	{
		float Y = M + 170.f * Scale;
		for (const FJetHudMessage& Msg : GM->Messages)
		{
			const float Age = Now - Msg.Born;
			if (Age > 3.5f) continue;
			const float Al = Age < 2.8f ? 1.f : 1.f - (Age - 2.8f) / 0.7f;
			const float W = Width(Msg.Text, 1.2f) + 24.f * Scale;
			DrawRect(FLinearColor(0.03f, 0.04f, 0.06f, 0.5f * Al), SX / 2.f - W / 2.f, Y, W, 30.f * Scale);
			Label(Msg.Text, SX / 2.f - W / 2.f + 12.f * Scale, Y + 5.f * Scale, 1.2f, FLinearColor(Msg.Color.R, Msg.Color.G, Msg.Color.B, Al));
			Y += 34.f * Scale;
		}
	}

	if (bShowMinimap) DrawMinimap(GM, R, SX - M - 220.f * Scale, SY - M - 150.f * Scale, 220.f * Scale, 150.f * Scale);

	if (bShowHints)
	{
		const AJetHorsePawn* P = GM->Horse;
		const TCHAR* Cam = TEXT("");
		if (P) switch (P->CameraMode) { case EJetCamera::Far: Cam = TEXT("Lejana"); break; case EJetCamera::Onboard: Cam = TEXT("A bordo"); break; case EJetCamera::Side: Cam = TEXT("Lateral"); break; case EJetCamera::TV: Cam = TEXT("TV"); break; default: Cam = TEXT("Seguimiento"); }
		Label(FString::Printf(TEXT("A/D girar · W/S ritmo · ESPACIO saltar · C cámara (%s) · R reiniciar"), Cam), M, SY - M - 18.f * Scale, 0.9f, Dim, Small);
	}

	if (GM->bShowResults) DrawResults(GM);
}

void AJetHUD::DrawMinimap(const AJetGameMode* GM, const UJetRideComponent* R, float X, float Y, float W, float H)
{
	const FJetCourse& C = R->CourseRef();
	if (C.Fences.Num() == 0) return;
	Panel(X, Y, W, H, 0.5f);
	const float Pad = 10.f * Scale;
	const float Sx = (W - 2 * Pad) / C.ArenaWidth, Sy = (H - 2 * Pad) / C.ArenaDepth, S = FMath::Min(Sx, Sy);
	const float Cx = X + W / 2.f, Cy = Y + H / 2.f;
	auto Map = [&](float Mx, float Mz) { return FVector2D(Cx + Mx * S, Cy + Mz * S); };
	const int32 Next = R->GetNextFence();
	for (const FJetFence& E : C.Fences)
	{
		const FVector2D L(-FMath::Sin(E.Heading), FMath::Cos(E.Heading));
		const FVector2D A = Map(E.X + L.X * E.HalfWidth, E.Z + L.Y * E.HalfWidth), B = Map(E.X - L.X * E.HalfWidth, E.Z - L.Y * E.HalfWidth);
		const FLinearColor Col = E.Index == Next ? Accent : (E.Index < Next ? FLinearColor(0.5f, 0.5f, 0.5f) : FLinearColor(0.9f, 0.9f, 0.9f));
		DrawLine(A.X, A.Y, B.X, B.Y, Col, E.Index == Next ? 3.f : 2.f);
	}
	for (int32 K = 0; K < 2; K++)
	{
		const FJetLine& Ln = K == 0 ? C.Start : C.Finish;
		const FVector2D L(-FMath::Sin(Ln.Heading), FMath::Cos(Ln.Heading));
		const FVector2D A = Map(Ln.X + L.X * Ln.HalfWidth, Ln.Z + L.Y * Ln.HalfWidth), B = Map(Ln.X - L.X * Ln.HalfWidth, Ln.Z - L.Y * Ln.HalfWidth);
		DrawLine(A.X, A.Y, B.X, B.Y, K == 0 ? FLinearColor(0.4f, 0.9f, 0.4f, 0.8f) : FLinearColor(0.9f, 0.3f, 0.3f, 0.8f), 1.5f);
	}
	// caballo: posición desde la simulación (cm relativos al origen de la pista)
	const FVector P = R->GetSimLocation() - R->ArenaOrigin;
	const FVector2D Hp = Map(P.X / 100.f, P.Y / 100.f);
	const float Yaw = FMath::DegreesToRadians(R->GetSimRotation().Yaw);
	DrawRect(Accent, Hp.X - 3.f, Hp.Y - 3.f, 6.f, 6.f);
	DrawLine(Hp.X, Hp.Y, Hp.X + FMath::Cos(Yaw) * 10.f, Hp.Y + FMath::Sin(Yaw) * 10.f, Accent, 2.f);
}

void AJetHUD::DrawResults(const AJetGameMode* GM)
{
	const float SX = Canvas->SizeX, SY = Canvas->SizeY;
	const float W = FMath::Min(520.f * Scale, SX - 40.f), RowH = 26.f * Scale;
	const float H = 110.f * Scale + RowH * GM->Ranking.Num();
	const float X = SX / 2.f - W / 2.f, Y = SY / 2.f - H / 2.f;
	Panel(X, Y, W, H, 0.85f);
	const FLinearColor White(0.96f, 0.96f, 0.94f), Dim(0.7f, 0.72f, 0.75f), Red(1.f, 0.35f, 0.3f), Green(0.45f, 0.95f, 0.5f);
	const FJetRoundResult& Res = GM->PlayerResult;
	FString Title;
	if (Res.bEliminated) Title = FString::Printf(TEXT("Eliminado: %s"), *Res.EliminationReason);
	else if (Res.Faults == 0) Title = FString::Printf(TEXT("¡Recorrido limpio! %.2f s"), Res.Time);
	else Title = FString::Printf(TEXT("%d faltas · %.2f s"), Res.Faults, Res.Time);
	Label(Title, X + 16.f * Scale, Y + 12.f * Scale, 1.5f, Res.bEliminated ? Red : (Res.Faults == 0 ? Green : White), Big);
	Label(GM->PlayerRank > 0 ? FString::Printf(TEXT("Puesto %d de %d"), GM->PlayerRank, GM->Ranking.Num()) : TEXT(""), X + 16.f * Scale, Y + 48.f * Scale, 1.f, Dim);
	float Ry = Y + 76.f * Scale;
	for (const FJetRankEntry& E : GM->Ranking)
	{
		const FLinearColor C = E.bPlayer ? Accent : White;
		if (E.bPlayer) DrawRect(FLinearColor(Accent.R, Accent.G, Accent.B, 0.12f), X + 6.f * Scale, Ry - 2.f, W - 12.f * Scale, RowH);
		Label(FString::Printf(TEXT("%d"), E.Rank), X + 16.f * Scale, Ry, 1.f, C);
		Label(FString::Printf(TEXT("%s / %s"), *E.Rider, *E.Horse), X + 50.f * Scale, Ry, 1.f, C);
		const FString Score = E.bEliminated ? TEXT("ELIM") : (GM->Mode == EJetMode::TableC ? FString::Printf(TEXT("%.2f s"), E.Time) : FString::Printf(TEXT("%d F · %.2f s"), E.Faults, E.Time));
		Label(Score, X + W - 16.f * Scale - Width(Score, 1.f), Ry, 1.f, E.bEliminated ? Red : C);
		Ry += RowH;
	}
	const FString Hint = TEXT("R: otra vuelta");
	Label(Hint, X + W - 16.f * Scale - Width(Hint, 0.9f, Small), Y + H - 22.f * Scale, 0.9f, Dim, Small);
}

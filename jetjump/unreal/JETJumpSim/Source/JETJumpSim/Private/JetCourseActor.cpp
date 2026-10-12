#include "JetCourseActor.h"
#include "JetSim.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInterface.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"

static const FLinearColor SCHEME_A[8] = { FLinearColor(0.78f, 0.16f, 0.16f), FLinearColor(0.12f, 0.31f, 0.64f), FLinearColor(0.18f, 0.49f, 0.2f), FLinearColor(0.83f, 0.63f, 0.09f), FLinearColor(0.08f, 0.13f, 0.29f), FLinearColor(0.88f, 0.48f, 0.1f), FLinearColor(0.07f, 0.55f, 0.55f), FLinearColor(0.1f, 0.1f, 0.1f) };

AJetCourseActor::AJetCourseActor()
{
	PrimaryActorTick.bCanEverTick = false;
	SetRootComponent(CreateDefaultSubobject<USceneComponent>(TEXT("Root")));
	static ConstructorHelpers::FObjectFinder<UStaticMesh> Cyl(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
	static ConstructorHelpers::FObjectFinder<UStaticMesh> Cub(TEXT("/Engine/BasicShapes/Cube.Cube"));
	static ConstructorHelpers::FObjectFinder<UStaticMesh> Pln(TEXT("/Engine/BasicShapes/Plane.Plane"));
	static ConstructorHelpers::FObjectFinder<UMaterialInterface> Mat(TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"));
	if (Cyl.Succeeded()) Cylinder = Cyl.Object;
	if (Cub.Succeeded()) Cube = Cub.Object;
	if (Pln.Succeeded()) Plane = Pln.Object;
	if (Mat.Succeeded()) BasicMat = Mat.Object;
}

void AJetCourseActor::BeginPlay()
{
	Super::BeginPlay();
	if (bBuildOnBeginPlay) BuildCourse();
}

UStaticMeshComponent* AJetCourseActor::AddPiece(UStaticMesh* M, UMaterialInterface* Mat, const FVector& Loc, const FRotator& Rot, const FVector& Scale, const FLinearColor& Tint, const FString& Name)
{
	if (!M) return nullptr;
	UStaticMeshComponent* C = NewObject<UStaticMeshComponent>(this, MakeUniqueObjectName(this, UStaticMeshComponent::StaticClass(), *Name));
	C->SetStaticMesh(M);
	C->SetupAttachment(GetRootComponent());
	C->RegisterComponent();
	C->SetRelativeLocation(Loc); C->SetRelativeRotation(Rot); C->SetRelativeScale3D(Scale);
	C->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
	C->SetCollisionResponseToAllChannels(ECR_Block);
	C->SetCollisionResponseToChannel(ECC_Pawn, ECR_Ignore); // el caballo lo gobierna la simulación
	UMaterialInterface* Base = Mat ? Mat : BasicMat;
	if (Base)
	{
		UMaterialInstanceDynamic* Dyn = UMaterialInstanceDynamic::Create(Base, this);
		Dyn->SetVectorParameterValue(TEXT("Color"), Tint);
		Dyn->SetVectorParameterValue(TEXT("BaseColor"), Tint);
		C->SetMaterial(0, Dyn);
	}
	Pieces.Add(C);
	return C;
}

void AJetCourseActor::ClearCourse()
{
	for (UStaticMeshComponent* C : Pieces) if (C) C->DestroyComponent();
	Pieces.Reset(); TopRails.Reset();
}

void AJetCourseActor::BuildCourse()
{
	ClearCourse();
	Course = JetSim::BuildCourse(Layout, Height, SpeedMPM, bJumpOff, Seed);
	UStaticMesh* RailM = RailMesh ? RailMesh : Cylinder;
	UStaticMesh* PostM = PostMesh ? PostMesh : Cube;
	UStaticMesh* BlockM = BlockMesh ? BlockMesh : Cube;
	const FLinearColor White(0.95f, 0.95f, 0.93f), Green(0.2f, 0.45f, 0.18f), Blue(0.12f, 0.42f, 0.72f), Brick(0.68f, 0.3f, 0.22f);
	TopRails.SetNum(Course.Fences.Num());
	for (const FJetFence& E : Course.Fences)
	{
		const FVector N(FMath::Cos(E.Heading), FMath::Sin(E.Heading), 0.f), L(-FMath::Sin(E.Heading), FMath::Cos(E.Heading), 0.f);
		const FVector Base(E.X * 100.f, E.Z * 100.f, 0.f);
		const FRotator Rot(0.f, FMath::RadiansToDegrees(E.Heading), 0.f);
		const FLinearColor Col = SCHEME_A[E.Scheme % 8];
		const float HalfCm = E.HalfWidth * 100.f;
		TopRails[E.Index].SetNum(E.Planes.Num());
		for (int32 Pi = 0; Pi < E.Planes.Num(); Pi++)
		{
			const FJetPlane& P = E.Planes[Pi];
			const FVector PBase = Base + N * (P.Offset * 100.f);
			const float Hcm = P.Height * 100.f;
			// postes
			for (int32 S = -1; S <= 1; S += 2)
			{
				const FVector Loc = PBase + L * (S * (HalfCm + 12.f)) + FVector(0, 0, (Hcm + 45.f) / 2.f);
				AddPiece(PostM, PostMaterial, Loc, Rot, FVector(0.12f, 0.12f, (Hcm + 45.f) / 100.f), Pi % 2 ? Col : White, FString::Printf(TEXT("Post_%d_%d_%d"), E.Index, Pi, S + 1));
			}
			if (E.Type == EJetFenceType::Wall)
			{
				const int32 Rows = FMath::RoundToInt(P.Height / 0.25f);
				for (int32 R = 0; R < Rows; R++)
				{
					const int32 Nb = 7; const float Bw = 2.f * HalfCm / Nb;
					for (int32 B = 0; B < Nb; B++)
					{
						const float Off = R % 2 ? Bw / 2.f : 0.f;
						const float Zc = -HalfCm + B * Bw + Bw / 2.f + Off;
						if (Zc + Bw / 2.f > HalfCm + 1.f) continue;
						UStaticMeshComponent* Blk = AddPiece(BlockM, nullptr, PBase + L * Zc + FVector(0, 0, R * 25.f + 12.5f), Rot, FVector(0.42f, (Bw - 2.f) / 100.f, 0.24f), R % 3 == 2 ? FLinearColor(0.77f, 0.75f, 0.72f) : Brick, FString::Printf(TEXT("Block_%d_%d_%d"), E.Index, R, B));
						if (R == Rows - 1 && Blk) TopRails[E.Index][Pi].Add(Blk);
					}
				}
			}
			else if (E.Type == EJetFenceType::Water)
			{
				const float W = (E.WaterEnd - E.WaterStart) * 100.f;
				AddPiece(Plane, WaterMaterial, Base + N * (E.WaterStart * 100.f + W / 2.f) + FVector(0, 0, 1.f), Rot, FVector(W / 100.f, 2.f * HalfCm / 100.f + 0.2f, 1.f), Blue, FString::Printf(TEXT("Water_%d"), E.Index));
				AddPiece(Cube, nullptr, Base + FVector(0, 0, 25.f), Rot, FVector(0.4f, 2.f * HalfCm / 100.f, 0.5f), Green, FString::Printf(TEXT("Hedge_%d"), E.Index));
				AddPiece(Cube, nullptr, Base + N * (E.WaterEnd * 100.f) + FVector(0, 0, 1.5f), Rot, FVector(0.08f, 2.f * HalfCm / 100.f + 0.2f, 0.03f), White, FString::Printf(TEXT("Tape_%d"), E.Index));
			}
			else
			{
				float Y = Hcm; bool bFirst = true;
				const float Bottom = E.Type == EJetFenceType::Liverpool ? Hcm - 45.f : 30.f;
				while (Y > Bottom - 1.f)
				{
					// barra: cilindro de 100 cm de alto acostado a lo largo de L
					UStaticMeshComponent* Rail = AddPiece(RailM, RailMaterial, PBase + FVector(0, 0, Y), FRotator(0.f, FMath::RadiansToDegrees(E.Heading), 90.f), FVector(0.1f, 0.1f, (2.f * HalfCm + 16.f) / 100.f), bFirst || (int32)(Y / 40.f) % 2 ? Col : White, FString::Printf(TEXT("Rail_%d_%d_%d"), E.Index, Pi, (int32)Y));
					if (bFirst && Rail) TopRails[E.Index][Pi].Add(Rail);
					bFirst = false;
					Y -= (E.Type == EJetFenceType::Oxer && Pi == 1) ? 45.f : 40.f;
					if (E.Type == EJetFenceType::TripleBar && Pi < 2) break;
					if (E.Type == EJetFenceType::Oxer && Pi == 1 && Y < Hcm - 50.f) break;
				}
				if (E.Type == EJetFenceType::Gate)
					for (int32 K = 0; K < 3; K++) AddPiece(Cube, nullptr, PBase + FVector(0, 0, Hcm - 25.f - K * 30.f), Rot, FVector(0.06f, 2.f * HalfCm / 100.f, 0.12f), White, FString::Printf(TEXT("Plank_%d_%d"), E.Index, K));
				if (E.Type == EJetFenceType::Liverpool)
					AddPiece(Plane, WaterMaterial, Base + N * 90.f + FVector(0, 0, 1.f), Rot, FVector(1.8f, 2.f * HalfCm / 100.f, 1.f), Blue, FString::Printf(TEXT("Tray_%d"), E.Index));
			}
		}
		// línea de tierra y número
		if (E.Type != EJetFenceType::Water)
			AddPiece(Cube, GroundLineMaterial, Base - N * 45.f + FVector(0, 0, 15.f), Rot, FVector(0.5f, 2.f * HalfCm / 100.f, 0.3f), Green, FString::Printf(TEXT("GroundLine_%d"), E.Index));
		AddPiece(Cube, nullptr, Base + L * (HalfCm + 56.f) + FVector(0, 0, 115.f), Rot, FVector(0.04f, 0.5f, 0.42f), White, FString::Printf(TEXT("Board_%d"), E.Index));
	}
	// banderas de salida y llegada: roja a la derecha, blanca a la izquierda
	for (int32 K = 0; K < 2; K++)
	{
		const FJetLine& Ln = K == 0 ? Course.Start : Course.Finish;
		const FVector L(-FMath::Sin(Ln.Heading), FMath::Cos(Ln.Heading), 0.f);
		const FVector Base(Ln.X * 100.f, Ln.Z * 100.f, 0.f);
		for (int32 S = -1; S <= 1; S += 2)
		{
			AddPiece(Cylinder, nullptr, Base + L * (S * Ln.HalfWidth * 100.f) + FVector(0, 0, 110.f), FRotator::ZeroRotator, FVector(0.06f, 0.06f, 2.2f), White, FString::Printf(TEXT("Pole_%d_%d"), K, S + 1));
			AddPiece(Cube, nullptr, Base + L * (S * Ln.HalfWidth * 100.f - S * 30.f) + FVector(0, 0, 195.f), FRotator(0.f, FMath::RadiansToDegrees(Ln.Heading), 0.f), FVector(0.02f, 0.55f, 0.4f), S > 0 ? FLinearColor(0.8f, 0.1f, 0.1f) : White, FString::Printf(TEXT("Flag_%d_%d"), K, S + 1));
		}
	}
}

void AJetCourseActor::KnockRail(int32 Fence, int32 Plane)
{
	if (!TopRails.IsValidIndex(Fence) || !TopRails[Fence].IsValidIndex(Plane) || !Course.Fences.IsValidIndex(Fence)) return;
	for (UStaticMeshComponent* C : TopRails[Fence][Plane])
	{
		if (!C || C->IsSimulatingPhysics()) continue;
		C->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
		C->SetCollisionResponseToChannel(ECC_Pawn, ECR_Ignore);
		C->SetSimulatePhysics(true);
		// la barra sale hacia adelante en el sentido del salto y gira sobre su eje largo
		const FJetFence& E = Course.Fences[Fence];
		const FVector N = GetActorRotation().RotateVector(FVector(FMath::Cos(E.Heading), FMath::Sin(E.Heading), 0.f));
		const FVector L = GetActorRotation().RotateVector(FVector(-FMath::Sin(E.Heading), FMath::Cos(E.Heading), 0.f));
		C->AddImpulse(N * FMath::FRandRange(120.f, 220.f) + L * FMath::FRandRange(-60.f, 60.f) + FVector(0.f, 0.f, 80.f), NAME_None, true);
		C->AddAngularImpulseInDegrees(L * FMath::FRandRange(-200.f, 200.f) + FVector(0.f, 0.f, FMath::FRandRange(-60.f, 60.f)), NAME_None, true);
	}
}

void AJetCourseActor::ResetRails() { BuildCourse(); }

FVector AJetCourseActor::FenceWorldLocation(int32 Fence) const
{
	if (!Course.Fences.IsValidIndex(Fence)) return GetActorLocation();
	const FJetFence& E = Course.Fences[Fence];
	return GetActorLocation() + FVector(E.X * 100.f, E.Z * 100.f, 0.f);
}

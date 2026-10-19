#include "JetHorsePawn.h"
#include "Components/SkeletalMeshComponent.h"
#include "Animation/AnimSequence.h"
#include "GameFramework/SpringArmComponent.h"
#include "Camera/CameraComponent.h"
#include "Components/InputComponent.h"
#include "JetSim.h"
#include "JetGameMode.h"
#include "Engine/World.h"

AJetHorsePawn::AJetHorsePawn()
{
	PrimaryActorTick.bCanEverTick = true;
	Root = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
	SetRootComponent(Root);

	Mesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("Mesh"));
	Mesh->SetupAttachment(Root);
	Mesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
	// La mayoría de los caballos del marketplace miran +X con el pivote entre los cascos; si no, girar la malla en el Blueprint.

	CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
	CameraBoom->SetupAttachment(Root);
	CameraBoom->TargetArmLength = 720.f;
	CameraBoom->SocketOffset = FVector(0.f, 60.f, 90.f);
	CameraBoom->TargetOffset = FVector(0.f, 0.f, 150.f);
	CameraBoom->SetRelativeRotation(FRotator(-12.f, 0.f, 0.f));
	CameraBoom->bDoCollisionTest = true;
	CameraBoom->ProbeSize = 20.f;
	CameraBoom->bEnableCameraLag = true;
	CameraBoom->bEnableCameraRotationLag = true;
	CameraBoom->CameraLagSpeed = 8.f;
	CameraBoom->CameraRotationLagSpeed = 6.f;
	CameraBoom->bUsePawnControlRotation = false;
	CameraBoom->bInheritPitch = false; CameraBoom->bInheritRoll = false;

	Camera = CreateDefaultSubobject<UCameraComponent>(TEXT("Camera"));
	Camera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);
	Camera->FieldOfView = 55.f;

	Ride = CreateDefaultSubobject<UJetRideComponent>(TEXT("Ride"));
	Ride->bDriveOwnerTransform = true;

}

void AJetHorsePawn::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	Super::SetupPlayerInputComponent(PlayerInputComponent);
	// Teclado: A/D o flechas giran, W/S ritmo, espacio salta, C cámara. Mando: stick izquierdo, A salta, Y cámara.
	PlayerInputComponent->BindKey(EKeys::A, IE_Pressed, this, &AJetHorsePawn::OnLeftP); PlayerInputComponent->BindKey(EKeys::A, IE_Released, this, &AJetHorsePawn::OnLeftR);
	PlayerInputComponent->BindKey(EKeys::Left, IE_Pressed, this, &AJetHorsePawn::OnLeftP); PlayerInputComponent->BindKey(EKeys::Left, IE_Released, this, &AJetHorsePawn::OnLeftR);
	PlayerInputComponent->BindKey(EKeys::D, IE_Pressed, this, &AJetHorsePawn::OnRightP); PlayerInputComponent->BindKey(EKeys::D, IE_Released, this, &AJetHorsePawn::OnRightR);
	PlayerInputComponent->BindKey(EKeys::Right, IE_Pressed, this, &AJetHorsePawn::OnRightP); PlayerInputComponent->BindKey(EKeys::Right, IE_Released, this, &AJetHorsePawn::OnRightR);
	PlayerInputComponent->BindKey(EKeys::W, IE_Pressed, this, &AJetHorsePawn::OnUpP); PlayerInputComponent->BindKey(EKeys::W, IE_Released, this, &AJetHorsePawn::OnUpR);
	PlayerInputComponent->BindKey(EKeys::Up, IE_Pressed, this, &AJetHorsePawn::OnUpP); PlayerInputComponent->BindKey(EKeys::Up, IE_Released, this, &AJetHorsePawn::OnUpR);
	PlayerInputComponent->BindKey(EKeys::S, IE_Pressed, this, &AJetHorsePawn::OnDownP); PlayerInputComponent->BindKey(EKeys::S, IE_Released, this, &AJetHorsePawn::OnDownR);
	PlayerInputComponent->BindKey(EKeys::Down, IE_Pressed, this, &AJetHorsePawn::OnDownP); PlayerInputComponent->BindKey(EKeys::Down, IE_Released, this, &AJetHorsePawn::OnDownR);
	PlayerInputComponent->BindKey(EKeys::SpaceBar, IE_Pressed, this, &AJetHorsePawn::OnJump);
	PlayerInputComponent->BindKey(EKeys::Enter, IE_Pressed, this, &AJetHorsePawn::OnJump);
	PlayerInputComponent->BindKey(EKeys::Gamepad_FaceButton_Bottom, IE_Pressed, this, &AJetHorsePawn::OnJump);
	PlayerInputComponent->BindKey(EKeys::C, IE_Pressed, this, &AJetHorsePawn::OnCamera);
	PlayerInputComponent->BindKey(EKeys::Gamepad_FaceButton_Top, IE_Pressed, this, &AJetHorsePawn::OnCamera);
	PlayerInputComponent->BindKey(EKeys::R, IE_Pressed, this, &AJetHorsePawn::OnRestart);
	PlayerInputComponent->BindKey(EKeys::Gamepad_Special_Right, IE_Pressed, this, &AJetHorsePawn::OnRestart);
	PlayerInputComponent->BindAxisKey(EKeys::Gamepad_LeftX, this, &AJetHorsePawn::OnAxisSteer);
	PlayerInputComponent->BindAxisKey(EKeys::Gamepad_LeftY, this, &AJetHorsePawn::OnAxisPace);
}

void AJetHorsePawn::BeginPlay()
{
	Super::BeginPlay();
	bSimpleAnimation = bForceSimpleAnimation || (Mesh && Mesh->GetAnimClass() == nullptr);
	if (bSimpleAnimation && Mesh)
	{
		Mesh->SetAnimationMode(EAnimationMode::AnimationSingleNode);
		CurrentAnim = nullptr;
	}
}

void AJetHorsePawn::OnLeft(bool b) { bLeft = b; }
void AJetHorsePawn::OnRight(bool b) { bRight = b; }
void AJetHorsePawn::OnUp(bool b) { bUp = b; }
void AJetHorsePawn::OnDown(bool b) { bDown = b; }
void AJetHorsePawn::OnJump() { if (Ride) Ride->AskJump(); }
void AJetHorsePawn::OnCamera() { CycleCamera(); }
void AJetHorsePawn::OnRestart()
{
	if (AJetGameMode* GM = GetWorld() ? GetWorld()->GetAuthGameMode<AJetGameMode>() : nullptr) GM->RestartRound();
}

void AJetHorsePawn::SetCameraMode(EJetCamera Mode) { CameraMode = Mode; }
void AJetHorsePawn::CycleCamera()
{
	static const EJetCamera Order[] = { EJetCamera::Chase, EJetCamera::Far, EJetCamera::Onboard, EJetCamera::Side, EJetCamera::TV };
	int32 I = 0; for (; I < 5; I++) if (Order[I] == CameraMode) break;
	CameraMode = Order[(I + 1) % 5];
	if (CameraMode == EJetCamera::TV) TVLocation = GetActorLocation() + FVector(0.f, -3000.f, 750.f);
}

void AJetHorsePawn::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
	// entrada combinada teclado + mando; el giro con tecla sube suave para poder afinar
	const float Ks = (bRight ? 1.f : 0.f) - (bLeft ? 1.f : 0.f);
	const float Kp = (bUp ? 1.f : 0.f) - (bDown ? 1.f : 0.f);
	KeySteer = FMath::FInterpTo(KeySteer, Ks, DeltaTime, Ks != 0.f ? 6.f : 12.f);
	KeyPace = Kp;
	const float Steer = FMath::Clamp(KeySteer + AxisSteer, -1.f, 1.f);
	const float Pace = FMath::Clamp(KeyPace + AxisPace, -1.f, 1.f);
	if (Ride) Ride->SetInput(Steer, Pace, false);

	// cabeceo y alabeo del cuerpo según la simulación (la cápsula no rota: solo la malla)
	if (Mesh && Ride)
	{
		const float PitchDeg = FMath::RadiansToDegrees(Ride->PitchRad) * JumpPitchScale;
		const float RollDeg = FMath::RadiansToDegrees(Ride->RollRad);
		Mesh->SetRelativeRotation(FRotator(PitchDeg, MeshYawOffset, RollDeg));
		Mesh->SetRelativeLocation(FVector(0.f, 0.f, MeshZOffset));
	}
	if (bSimpleAnimation) ApplySimpleAnimation(DeltaTime);
	ApplyCamera(DeltaTime);
}

void AJetHorsePawn::ApplySimpleAnimation(float DeltaTime)
{
	if (!Mesh || !Ride) return;
	// elegir clip: salto > rehúse > aire; con reemplazos si falta alguno
	UAnimSequence* Cycle = nullptr; float StridesPerClip = 1.f;
	switch (Ride->Gait)
	{
	case EJetGait::Walk: Cycle = WalkAnim ? WalkAnim : TrotAnim; StridesPerClip = WalkAnim ? WalkStridesPerClip : TrotStridesPerClip; break;
	case EJetGait::Trot: Cycle = TrotAnim ? TrotAnim : (CanterAnim ? CanterAnim : WalkAnim); StridesPerClip = TrotAnim ? TrotStridesPerClip : CanterStridesPerClip; break;
	case EJetGait::Canter: Cycle = CanterAnim ? CanterAnim : (GallopAnim ? GallopAnim : TrotAnim); StridesPerClip = CanterStridesPerClip; break;
	case EJetGait::Gallop: Cycle = GallopAnim ? GallopAnim : (CanterAnim ? CanterAnim : TrotAnim); StridesPerClip = CanterStridesPerClip; break;
	default: Cycle = IdleAnim ? IdleAnim : WalkAnim; break;
	}
	UAnimSequence* Want = Cycle;
	bool bLoop = true;
	if (Ride->bJumping && JumpAnim) { Want = JumpAnim; bLoop = false; }
	else if (Ride->bRefusing && RefuseAnim) { Want = RefuseAnim; bLoop = false; }
	if (!Want) return;
	if (Want != CurrentAnim)
	{
		Mesh->PlayAnimation(Want, bLoop);
		CurrentAnim = Want;
		if (Want == Cycle) Mesh->SetPosition(FMath::Fmod(SimplePhase, 1.f) * Want->GetPlayLength(), false);
	}
	const float Len = FMath::Max(Want->GetPlayLength(), 0.05f);
	if (Want == JumpAnim && Ride->bJumping)
	{
		// el clip de salto sigue la parábola: 0 batida, 0.5 ápice, 1 recepción
		const float P = FMath::Lerp(JumpClipAirStart, JumpClipAirEnd, Ride->JumpProgress);
		Mesh->SetPlayRate(0.f);
		Mesh->SetPosition(P * Len, false);
	}
	else if (Want == Cycle)
	{
		// ciclo sincronizado con el tranco: avanza con la frecuencia real del caballo
		const float Freq = Ride->Gait == EJetGait::Halt ? (1.f / Len) : Ride->StrideFrequency / FMath::Max(StridesPerClip, 0.1f);
		Mesh->SetPlayRate(FMath::Max(Freq * Len, 0.01f));
		SimplePhase += Freq * DeltaTime;
	}
	else Mesh->SetPlayRate(1.f);
}

void AJetHorsePawn::ApplyCamera(float DeltaTime)
{
	if (!CameraBoom || !Camera || !Ride) return;
	const float Sp = FMath::Clamp(Ride->Speed / 10.f, 0.f, 1.f);
	const float K = WithersHeightCm / 165.f;
	switch (CameraMode)
	{
	case EJetCamera::Far:
		CameraBoom->TargetArmLength = (1150.f + 200.f * Sp) * K; CameraBoom->SocketOffset = FVector(0.f, 120.f, 260.f) * K; CameraBoom->TargetOffset = FVector(0.f, 0.f, 150.f) * K;
		CameraBoom->SetRelativeRotation(FRotator(-16.f, 0.f, 0.f)); Camera->FieldOfView = 50.f; CameraBoom->bDoCollisionTest = true; break;
	case EJetCamera::Onboard:
		CameraBoom->TargetArmLength = 0.f; CameraBoom->SocketOffset = FVector(60.f, 0.f, 0.f) * K; CameraBoom->TargetOffset = FVector(40.f, 0.f, 215.f) * K;
		CameraBoom->SetRelativeRotation(FRotator(-6.f, 0.f, 0.f)); Camera->FieldOfView = 75.f; CameraBoom->bDoCollisionTest = false; break;
	case EJetCamera::Side:
		CameraBoom->TargetArmLength = 900.f * K; CameraBoom->SocketOffset = FVector::ZeroVector; CameraBoom->TargetOffset = FVector(0.f, 0.f, 120.f) * K;
		CameraBoom->SetRelativeRotation(FRotator(-8.f, -90.f, 0.f)); Camera->FieldOfView = 45.f; CameraBoom->bDoCollisionTest = true; break;
	case EJetCamera::TV:
	{
		// cámara fija que sigue al caballo con zoom
		CameraBoom->TargetArmLength = 0.f; CameraBoom->bDoCollisionTest = false;
		const FVector Target = GetActorLocation() + FVector(0.f, 0.f, 110.f * K);
		Camera->SetWorldLocation(TVLocation);
		Camera->SetWorldRotation((Target - TVLocation).Rotation());
		const float D = FVector::Dist(Target, TVLocation);
		Camera->FieldOfView = FMath::Clamp(90000.f / FMath::Max(D, 1.f), 14.f, 40.f);
		return;
	}
	default:
		CameraBoom->TargetArmLength = (720.f + 150.f * Sp) * K; CameraBoom->SocketOffset = FVector(0.f, 60.f, 90.f) * K; CameraBoom->TargetOffset = FVector(0.f, 0.f, 150.f) * K;
		CameraBoom->SetRelativeRotation(FRotator(-12.f, 0.f, 0.f)); Camera->FieldOfView = 55.f + 10.f * Sp; CameraBoom->bDoCollisionTest = true; break;
	}
	Camera->SetRelativeLocation(FVector::ZeroVector);
	Camera->SetRelativeRotation(FRotator::ZeroRotator);
}

// ------------------------------------------------------------ AnimInstance
void UJetHorseAnimInstance::NativeUpdateAnimation(float DeltaSeconds)
{
	Super::NativeUpdateAnimation(DeltaSeconds);
	const AActor* Owner = GetOwningActor();
	const UJetRideComponent* R = Owner ? Owner->FindComponentByClass<UJetRideComponent>() : nullptr;
	if (!R) return;
	Speed = R->Speed; SpeedKmh = R->SpeedKmh; Gait = (int32)R->Gait; StridePhase = R->StridePhase; StrideFrequency = R->StrideFrequency;
	Lead = R->Lead; bJumping = R->bJumping; JumpProgress = R->JumpProgress; TurnRate = R->TurnRate; bRefusing = R->bRefusing;
	CyclePlayRate = R->StrideFrequency;
}

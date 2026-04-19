import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../bloc/entrepreneur_profile_bloc.dart';

class EntrepreneurProfilePage extends StatefulWidget {
  const EntrepreneurProfilePage({super.key});

  @override
  State<EntrepreneurProfilePage> createState() => _EntrepreneurProfilePageState();
}

class _EntrepreneurProfilePageState extends State<EntrepreneurProfilePage> {
  final _formKey = GlobalKey<FormState>();

  final _fullName = TextEditingController();
  final _companyName = TextEditingController();
  final _companyReg = TextEditingController();
  final _sector = TextEditingController();
  final _stage = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<EntrepreneurProfileBloc>().add(const EntrepreneurProfileChecked());
  }

  @override
  void dispose() {
    _fullName.dispose();
    _companyName.dispose();
    _companyReg.dispose();
    _sector.dispose();
    _stage.dispose();
    super.dispose();
  }

  void _submitCreate() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    context.read<EntrepreneurProfileBloc>().add(
          EntrepreneurProfileCreateRequested(
            fullName: _fullName.text.trim(),
            companyName: _companyName.text.trim(),
            companyRegistrationNumber: _companyReg.text.trim(),
            businessSector: _sector.text.trim(),
            businessStage: _stage.text.trim(),
          ),
        );
  }

  void _load() {
    context.read<EntrepreneurProfileBloc>().add(const EntrepreneurProfileLoaded());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Entrepreneur Profile'),
        actions: [
          IconButton(
            onPressed: _load,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: BlocConsumer<EntrepreneurProfileBloc, EntrepreneurProfileState>(
            listener: (context, state) {
              final profile = state.profile;
              if (state.status == EntrepreneurProfileStatus.loaded && profile != null) {
                _fullName.text = profile.fullName;
                _companyName.text = profile.companyName;
                _sector.text = profile.businessSector;
                _stage.text = profile.businessStage;
              }
            },
            builder: (context, state) {
              if (state.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }
              if (state.status == EntrepreneurProfileStatus.error) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      state.error ?? 'Something went wrong',
                      style: TextStyle(color: Theme.of(context).colorScheme.error),
                    ),
                    AppSpacing.gapMd,
                    AppButton(text: 'Retry', onPressed: _load),
                  ],
                );
              }

              if (state.status == EntrepreneurProfileStatus.missing ||
                  state.status == EntrepreneurProfileStatus.initial) {
                return _buildCreateForm();
              }

              if (state.profile == null) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Profile exists. Load to view/edit.'),
                    AppSpacing.gapMd,
                    AppButton(text: 'Load profile', onPressed: _load),
                  ],
                );
              }

              return _buildView(state);
            },
          ),
        ),
      ),
    );
  }

  Widget _buildCreateForm() {
    return Form(
      key: _formKey,
      child: ListView(
        children: [
          const Text('Create your entrepreneur profile'),
          AppSpacing.gapMd,
          AppTextField(
            label: 'Full Name',
            controller: _fullName,
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
          ),
          AppSpacing.gapMd,
          AppTextField(
            label: 'Company Name',
            controller: _companyName,
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
          ),
          AppSpacing.gapMd,
          AppTextField(
            label: 'Company Registration Number',
            controller: _companyReg,
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
          ),
          AppSpacing.gapMd,
          AppTextField(
            label: 'Business Sector',
            controller: _sector,
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
          ),
          AppSpacing.gapMd,
          AppTextField(
            label: 'Business Stage',
            hint: 'idea / mvp / early-revenue / scaling',
            controller: _stage,
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
          ),
          AppSpacing.gapLg,
          AppButton(text: 'Create profile', onPressed: _submitCreate),
        ],
      ),
    );
  }

  Widget _buildView(EntrepreneurProfileState state) {
    final profile = state.profile!;
    return ListView(
      children: [
        Text('Full name: ${profile.fullName}'),
        Text('Company: ${profile.companyName}'),
        Text('Sector: ${profile.businessSector}'),
        Text('Stage: ${profile.businessStage}'),
        AppSpacing.gapLg,
        AppButton(
          text: 'Edit (quick update)',
          onPressed: () {
            context.read<EntrepreneurProfileBloc>().add(
                  EntrepreneurProfileUpdateRequested({
                    'fullName': _fullName.text.trim().isEmpty ? profile.fullName : _fullName.text.trim(),
                    'companyName': _companyName.text.trim().isEmpty ? profile.companyName : _companyName.text.trim(),
                    'businessStage': _stage.text.trim().isEmpty ? profile.businessStage : _stage.text.trim(),
                  }),
                );
          },
        ),
        AppSpacing.gapMd,
        const Text('Tip: use the fields above then tap Edit.'),
      ],
    );
  }
}


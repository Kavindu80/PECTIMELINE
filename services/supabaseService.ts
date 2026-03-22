import { supabase } from './supabaseClient';
import { Project, BrainstormSolution } from '../types';
import { projectToDatabase, databaseToProject, databaseToSolution, solutionToDatabase } from './databaseMapper';
import { cacheService } from './cacheService';

const CACHE_KEYS = {
  PROJECTS: 'all_projects',
  SOLUTIONS: 'all_solutions',
};

// ==================== PROJECTS ====================

// Fetch all projects
export const fetchProjects = async (): Promise<Project[]> => {
  const cached = cacheService.get<Project[]>(CACHE_KEYS.PROJECTS);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  // Convert database format to TypeScript format
  const projects = (data || []).map(databaseToProject);
  cacheService.set(CACHE_KEYS.PROJECTS, projects);

  return projects;
};

// Fetch single project by ID
export const fetchProjectById = async (id: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    throw error;
  }

  // Convert database format to TypeScript format
  return data ? databaseToProject(data) : null;
};

// Create new project
export const createProject = async (project: Partial<Project>): Promise<Project> => {
  // Convert TypeScript format to database format
  const dbProject = projectToDatabase(project);

  // Remove id — let the database auto-generate UUID
  delete dbProject.id;
  // Remove fields that reference auth.users (created_by, updated_by) since we don't track this
  delete dbProject.created_by;
  delete dbProject.updated_by;

  const { data, error } = await supabase
    .from('projects')
    .insert([dbProject])
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating project:', error);
    throw error;
  }

  console.log('✅ Project created successfully:', data.id);
  cacheService.invalidate(CACHE_KEYS.PROJECTS);
  // Convert back to TypeScript format
  return databaseToProject(data);
};

// Update project
export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
  // Convert TypeScript format to database format
  const dbUpdates = projectToDatabase(updates);

  // Remove id — cannot update a primary key
  delete dbUpdates.id;
  // Remove fields that reference auth.users
  delete dbUpdates.created_by;
  delete dbUpdates.updated_by;
  // Remove created_at — should not be updated
  delete dbUpdates.created_at;

  const { data, error } = await supabase
    .from('projects')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating project:', id);
    throw error;
  }

  console.log('✅ Project updated successfully:', id);
  cacheService.invalidate(CACHE_KEYS.PROJECTS);
  // Convert back to TypeScript format
  return databaseToProject(data);
};

// Delete project
export const deleteProject = async (id: string): Promise<void> => {
  console.log('🗑️ Deleting project:', id);

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ Error deleting project:', error);
    throw error;
  }

  console.log('✅ Project deleted successfully:', id);
  cacheService.invalidate(CACHE_KEYS.PROJECTS);
};

// Convert database solution to TypeScript format
const solutionToTypeScript = (dbSolution: any): BrainstormSolution => {
  return {
    id: dbSolution.id,
    entryDate: dbSolution.entry_date || '',
    machineCode: dbSolution.machine_code || '',
    operationSMV: dbSolution.operation_smv || '',
    actualSmv: dbSolution.actual_smv,
    expectedSmv: dbSolution.expected_smv,
    routedSmv: dbSolution.routed_smv,
    savingSmv: dbSolution.saving_smv,
    operation: dbSolution.operation || '',
    solutionText: dbSolution.solution_text || '',
    comments: dbSolution.comments || '',
    team: dbSolution.team || '',
    responsible: dbSolution.responsible || '',
    startDate: dbSolution.start_date || '',
    expectedEndDate: dbSolution.expected_end_date || '',
    actualEndDate: dbSolution.actual_end_date || '',
    actualMachineDate: dbSolution.actual_machine_date,
    status: dbSolution.status || 'Pending',
    videoLink: dbSolution.video_link,
    videoDescription: dbSolution.video_description,
    stwLink: dbSolution.stw_link,
    mdsLink: dbSolution.mds_link,
    pdLink: dbSolution.pd_link,
    videoDate: dbSolution.video_date,
    stwDate: dbSolution.stw_date,
    mdsDate: dbSolution.mds_date,
    pdDate: dbSolution.pd_date,
    yamazumiChartLink: dbSolution.yamazumi_chart_link,
    yamazumiChartDate: dbSolution.yamazumi_chart_date,
    craftsmanshipLevel: dbSolution.craftsmanship_level,
    layoutLink: dbSolution.layout_link,
    layoutDate: dbSolution.layout_date,
    stageTracking: dbSolution.stage_tracking || {},
    machines: []
  };
};

// Fetch solutions for a project
export const fetchSolutionsByProjectId = async (projectId: string): Promise<BrainstormSolution[]> => {
  const { data, error } = await supabase
    .from('brainstorm_solutions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching solutions:', error);
    throw error;
  }
  return (data || []).map(databaseToSolution);
};

// Fetch ALL solutions (batch — used on app mount)
export const fetchAllSolutions = async (): Promise<Record<string, BrainstormSolution[]>> => {
  const cached = cacheService.get<Record<string, BrainstormSolution[]>>(CACHE_KEYS.SOLUTIONS);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('brainstorm_solutions')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching all solutions:', error);
    return {};
  }

  // Group by project_id
  const grouped: Record<string, BrainstormSolution[]> = {};
  for (const row of (data || [])) {
    const projectId = row.project_id;
    if (!grouped[projectId]) grouped[projectId] = [];
    grouped[projectId].push(databaseToSolution(row));
  }
  
  cacheService.set(CACHE_KEYS.SOLUTIONS, grouped);
  return grouped;
};

// Create new solution
export const createSolution = async (solution: BrainstormSolution, projectId: string): Promise<BrainstormSolution> => {
  const dbSolution = solutionToDatabase(solution, projectId);
  delete dbSolution.id; // Let DB auto-generate UUID

  const { data, error } = await supabase
    .from('brainstorm_solutions')
    .insert([dbSolution])
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating solution for project:', projectId);
    throw error;
  }

  console.log('✅ Solution created:', data.id);
  cacheService.invalidate(CACHE_KEYS.SOLUTIONS);
  return databaseToSolution(data);
};

// Update solution
export const updateSolution = async (id: string, updates: Partial<BrainstormSolution>, projectId: string): Promise<BrainstormSolution> => {
  console.group(`📝 UPDATE SOLUTION: ${id}`);
  console.log('Updates received:', JSON.parse(JSON.stringify(updates)));
  console.log('Stage tracking in updates:', JSON.parse(JSON.stringify(updates.stageTracking || {})));
  
  const dbUpdates = solutionToDatabase(updates, projectId);
  delete dbUpdates.id;
  delete dbUpdates.created_at;

  console.log('DB updates to send:', JSON.parse(JSON.stringify(dbUpdates)));
  console.log('Stage tracking in DB updates:', JSON.parse(JSON.stringify(dbUpdates.stage_tracking || {})));

  const { data, error } = await supabase
    .from('brainstorm_solutions')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating solution:', id);
    console.groupEnd();
    throw error;
  }

  console.log('✅ Solution updated:', id);
  console.log('Data returned from DB:', JSON.parse(JSON.stringify(data)));
  console.log('Stage tracking returned from DB:', JSON.parse(JSON.stringify(data.stage_tracking || {})));
  
  const result = databaseToSolution(data);
  console.log('Converted result stage tracking:', JSON.parse(JSON.stringify(result.stageTracking || {})));
  console.groupEnd();
  
  cacheService.invalidate(CACHE_KEYS.SOLUTIONS);
  return result;
};

// Delete solution
export const deleteSolution = async (id: string): Promise<void> => {
  console.log('🗑️ Deleting solution:', id);

  const { error } = await supabase
    .from('brainstorm_solutions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ Error deleting solution:', error);
    throw error;
  }

  console.log('✅ Solution deleted:', id);
  cacheService.invalidate(CACHE_KEYS.SOLUTIONS);
};

// ==================== SOLUTION SYNC ====================
// Syncs an array of solutions with the database for a project
// Detects new, modified, and deleted solutions
export const syncProjectSolutions = async (
  projectId: string,
  currentSolutions: BrainstormSolution[],
  previousSolutions: BrainstormSolution[]
): Promise<BrainstormSolution[]> => {
  // Create a map to store processed solutions by their original index
  const resultMap = new Map<number, BrainstormSolution>();

  const previousIds = new Set(previousSolutions.map(s => s.id));
  const currentIds = new Set(currentSolutions.map(s => s.id));

  // 1. Find NEW solutions (local IDs like "sol-123" that aren't real UUIDs)
  const isLocalId = (id: string) => id.startsWith('sol-') || id.startsWith('ck-') || id.startsWith('fl-');

  const newSolutions = currentSolutions.filter(sol => isLocalId(sol.id));
  const existingSolutions = currentSolutions.filter(sol => !isLocalId(sol.id));
  const deletedSolutions = previousSolutions.filter(prev => !isLocalId(prev.id) && !currentIds.has(prev.id));

  // Bulk Insert New Solutions
  if (newSolutions.length > 0) {
    const dbSolutions = newSolutions.map(sol => {
      const dbSol = solutionToDatabase(sol, projectId);
      delete dbSol.id;
      return dbSol;
    });

    try {
      const { data, error } = await supabase
        .from('brainstorm_solutions')
        .insert(dbSolutions)
        .select();

      if (error) {
        console.error('❌ Error batch creating solutions:', error);
        // Keep original solutions in their positions
        newSolutions.forEach((sol, idx) => {
          const originalIndex = currentSolutions.findIndex(s => s.id === sol.id);
          if (originalIndex !== -1) {
            resultMap.set(originalIndex, sol);
          }
        });
      } else {
        console.log(`✅ ${data.length} new solutions created for project ${projectId}`);
        // Map new DB solutions back to their original positions
        const createdSolutions = data.map(databaseToSolution);
        
        newSolutions.forEach((originalSol, idx) => {
          const originalIndex = currentSolutions.findIndex(s => s.id === originalSol.id);
          if (originalIndex !== -1 && createdSolutions[idx]) {
            resultMap.set(originalIndex, createdSolutions[idx]);
          }
        });
      }
    } catch (err) {
      console.error('Failed to batch create solutions:', err);
      // Keep original solutions in their positions
      newSolutions.forEach(sol => {
        const originalIndex = currentSolutions.findIndex(s => s.id === sol.id);
        if (originalIndex !== -1) {
          resultMap.set(originalIndex, sol);
        }
      });
    }
  }

  // Parallel Update Modified Solutions
  const updatePromises = existingSolutions.map(async sol => {
    const originalIndex = currentSolutions.findIndex(s => s.id === sol.id);
    const prev = previousSolutions.find(p => p.id === sol.id);
    
    if (prev && JSON.stringify(prev) !== JSON.stringify(sol)) {
      console.log(`📝 Solution changed, updating: ${sol.id}`);
      console.log('Previous stage tracking:', JSON.parse(JSON.stringify(prev.stageTracking || {})));
      console.log('Current stage tracking:', JSON.parse(JSON.stringify(sol.stageTracking || {})));
      try {
        const updated = await updateSolution(sol.id, sol, projectId);
        console.log('Updated solution stage tracking:', JSON.parse(JSON.stringify(updated.stageTracking || {})));
        resultMap.set(originalIndex, updated);
      } catch (err) {
        console.error('Failed to update solution:', sol.id, err);
        resultMap.set(originalIndex, sol);
      }
    } else {
      console.log(`✅ Solution unchanged: ${sol.id}, keeping local version`);
      resultMap.set(originalIndex, sol);
    }
  });

  await Promise.all(updatePromises);

  // Batch Delete Solutions
  if (deletedSolutions.length > 0) {
    const idsToDelete = deletedSolutions.map(s => s.id);
    try {
      const { error } = await supabase
        .from('brainstorm_solutions')
        .delete()
        .in('id', idsToDelete);

      if (error) {
        console.error('❌ Error batch deleting solutions:', error);
      } else {
        console.log(`✅ ${idsToDelete.length} solutions deleted from project ${projectId}`);
      }
    } catch (err) {
      console.error('Failed to batch delete solutions:', err);
    }
  }

  if (newSolutions.length > 0 || deletedSolutions.length > 0) {
    cacheService.invalidate(CACHE_KEYS.SOLUTIONS);
  }

  // Reconstruct the results array in the original order
  const results: BrainstormSolution[] = [];
  for (let i = 0; i < currentSolutions.length; i++) {
    const solution = resultMap.get(i);
    if (solution) {
      results.push(solution);
    }
  }

  return results;
};

// ==================== NOTIFICATIONS ====================

// Fetch notifications
export const fetchNotifications = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
};

// Create notification
export const createNotification = async (notification: {
  project_id: string;
  message: string;
  type: string;
  owner: string;
}): Promise<any> => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([notification])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Mark notification as read
export const markNotificationAsRead = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);

  if (error) throw error;
};

// ==================== STORAGE ====================

// Upload file to storage
export const uploadFile = async (
  bucket: 'documents' | 'videos' | 'images',
  path: string,
  file: File
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
};

// Delete file from storage
export const deleteFile = async (
  bucket: 'documents' | 'videos' | 'images',
  path: string
): Promise<void> => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
};

// Get file URL
export const getFileUrl = async (
  bucket: 'documents' | 'videos' | 'images',
  path: string
): Promise<string> => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
};

// ==================== REALTIME SUBSCRIPTIONS ====================

// Subscribe to project changes
export const subscribeToProjects = (callback: (payload: any) => void) => {
  return supabase
    .channel('projects-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, callback)
    .subscribe();
};

// Subscribe to solution changes
export const subscribeToSolutions = (projectId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`solutions-${projectId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'brainstorm_solutions',
      filter: `project_id=eq.${projectId}`
    }, callback)
    .subscribe();
};

// Unsubscribe from channel
export const unsubscribe = (channel: any) => {
  supabase.removeChannel(channel);
};

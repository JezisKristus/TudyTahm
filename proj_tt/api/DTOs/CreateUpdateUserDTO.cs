using System.ComponentModel.DataAnnotations;

namespace TT_API.DTOs {
    public class CreateUpdateUserDTO {
        [StringLength(50)]
        public string? UserName { get; set; }
        
        [StringLength(100)]
        public string? UserPassword { get; set; }
        
        [EmailAddress]
        [StringLength(100)]
        public string? UserEmail { get; set; }
        
        [StringLength(200)]
        public string? UserIconPath { get; set; }
    }
}
